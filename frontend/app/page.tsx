
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  LayoutDashboard,
  Moon,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sun,
  Utensils,
  Users,
  X,
} from "lucide-react";
import PersianDatePicker from "./components/PersianDatePicker";

type Person = {
  id: number;
  name: string;
};

type Food = {
  id: number;
  name: string;
};

type TimeEntry = {
  id: number;
  person_id: number;
  entry_date: string;
  start_time: string;
  end_time: string;
  report?: string | null;
  food?: string | null;
  foods?: Food[];
};

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

function todayISO() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function toFa(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function jalaliDate(
  value: string,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(date);
}

function weekday(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function minutesBetween(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 0;
  }

  let result =
    endHour * 60 +
    endMinute -
    (startHour * 60 + startMinute);

  if (result < 0) result += 24 * 60;

  return result;
}

function durationLabel(minutes: number) {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!hours) return `${toFa(remainingMinutes)} دقیقه`;
  if (!remainingMinutes) return `${toFa(hours)} ساعت`;

  return `${toFa(hours)} ساعت و ${toFa(remainingMinutes)} دقیقه`;
}

function shiftDate(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * هفته از شنبه شروع می‌شود.
 */
function getWeekStart(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const daysSinceSaturday = (date.getDay() + 1) % 7;

  date.setDate(date.getDate() - daysSinceSaturday);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: T[] }).items;
  }

  return [];
}

function entryFoodNames(entry: TimeEntry) {
  const names = (entry.foods || [])
    .map((food) => food.name)
    .filter(Boolean);

  if (names.length) return names;

  return entry.food ? [entry.food] : [];
}

function downloadCSV(entries: TimeEntry[], people: Person[]) {
  const rows = [
    ["فرد", "تاریخ", "روز هفته", "شروع", "پایان", "مدت", "غذا", "گزارش"],
    ...entries.map((entry) => [
      people.find((person) => person.id === entry.person_id)?.name || "",
      jalaliDate(entry.entry_date),
      weekday(entry.entry_date),
      entry.start_time,
      entry.end_time,
      durationLabel(
        minutesBetween(entry.start_time, entry.end_time),
      ),
      entryFoodNames(entry).join("، "),
      entry.report || "",
    ]),
  ];

  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "activitylog-report.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPersonSaving, setAddingPersonSaving] = useState(false);
  const [addingFood, setAddingFood] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [dark, setDark] = useState(false);
  const [view, setView] = useState<"register" | "history" | "report">(
    "register",
  );

  const [selectedPerson, setSelectedPerson] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filterDate, setFilterDate] = useState("");
  const [filterPerson, setFilterPerson] = useState<number | "">("");
  const [search, setSearch] = useState("");

  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [selectedFoods, setSelectedFoods] = useState<number[]>([]);
  const [newFoodName, setNewFoodName] = useState("");
  const [reportText, setReportText] = useState("");

  const [personName, setPersonName] = useState("");
  const [addingPerson, setAddingPerson] = useState(false);

  const [weekAnchor, setWeekAnchor] = useState(todayISO());

  useEffect(() => {
    const savedTheme = localStorage.getItem("activitylog-theme");
    const enabled =
      savedTheme === "dark" ||
      (savedTheme === null &&
        document.documentElement.classList.contains("dark"));

    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [peopleResponse, entriesResponse, foodsResponse] =
        await Promise.all([
          fetch(`${API}/people`, { cache: "no-store" }),
          fetch(`${API}/times`, { cache: "no-store" }),
          fetch(`${API}/foods`, { cache: "no-store" }),
        ]);

      if (!peopleResponse.ok) {
        throw new Error("دریافت فهرست افراد ناموفق بود.");
      }

      if (!entriesResponse.ok) {
        throw new Error("دریافت سوابق ناموفق بود.");
      }

      const peopleData: unknown = await peopleResponse.json();
      const entriesData: unknown = await entriesResponse.json();

      // خالی بودن فهرست غذاها خطا نیست.
      let foodsData: unknown = [];

      if (foodsResponse.ok) {
        foodsData = await foodsResponse.json();
      }

      setPeople(normalizeList<Person>(peopleData));
      setEntries(normalizeList<TimeEntry>(entriesData));
      setFoods(normalizeList<Food>(foodsData));
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "ارتباط با سرور برقرار نشد.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function toggleTheme() {
    const next = !dark;

    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("activitylog-theme", next ? "dark" : "light");
  }

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  const todayEntries = useMemo(
    () => entries.filter((entry) => entry.entry_date === todayISO()),
    [entries],
  );

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fa");

    return [...entries]
      .filter((entry) => !filterDate || entry.entry_date === filterDate)
      .filter(
        (entry) =>
          filterPerson === "" || entry.person_id === filterPerson,
      )
      .filter((entry) => {
        if (!query) return true;

        const person =
          people.find((item) => item.id === entry.person_id)?.name || "";

        const foodNames = entryFoodNames(entry).join(" ");

        return `${person} ${entry.report || ""} ${foodNames}`
          .toLocaleLowerCase("fa")
          .includes(query);
      })
      .sort((a, b) =>
        `${b.entry_date} ${b.start_time}`.localeCompare(
          `${a.entry_date} ${a.start_time}`,
        ),
      );
  }, [entries, filterDate, filterPerson, people, search]);

  const weekStart = getWeekStart(weekAnchor);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index)),
    [weekStart],
  );

  const weekEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.entry_date >= weekDates[0] &&
          entry.entry_date <= weekDates[6],
      ),
    [entries, weekDates],
  );

  const weekMinutes = useMemo(
    () =>
      weekEntries.reduce(
        (sum, entry) =>
          sum + minutesBetween(entry.start_time, entry.end_time),
        0,
      ),
    [weekEntries],
  );

  const dailyMinutes = useMemo(
    () =>
      weekDates.map((date) =>
        weekEntries
          .filter((entry) => entry.entry_date === date)
          .reduce(
            (sum, entry) =>
              sum + minutesBetween(entry.start_time, entry.end_time),
            0,
          ),
      ),
    [weekDates, weekEntries],
  );

  const maximumDailyMinutes = Math.max(1, ...dailyMinutes);

  /**
   * غذای جدید از همان فرم فعالیت ایجاد می‌شود.
   * API فعلی بک‌اند نام غذا را به‌صورت query parameter می‌پذیرد.
   */
  async function addFood() {
    const name = newFoodName.trim();

    if (!name || addingFood) return;

    setError("");
    setNotice("");
    setAddingFood(true);

    try {
      // جلوگیری از ایجاد تکرار در صورت وجود نام یکسان.
      const existingFood = foods.find(
        (food) =>
          food.name.trim().toLocaleLowerCase("fa") ===
          name.toLocaleLowerCase("fa"),
      );

      if (existingFood) {
        setSelectedFoods((current) =>
          current.includes(existingFood.id)
            ? current
            : [...current, existingFood.id],
        );

        setNewFoodName("");
        notify("این غذا از قبل وجود داشت و انتخاب شد.");
        return;
      }

      const params = new URLSearchParams({ name });

      const response = await fetch(`${API}/foods?${params.toString()}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) || "افزودن غذا ناموفق بود.",
        );
      }

      // API باید شیء غذای ساخته‌شده را برگرداند.
      const result = (await response.json()) as Food;

      // فهرست را از سرور دوباره می‌گیریم تا داده‌ها همگام باشند.
      const foodsResponse = await fetch(`${API}/foods`, {
        cache: "no-store",
      });

      if (!foodsResponse.ok) {
        throw new Error(
          "غذا ثبت شد، اما دریافت فهرست غذاها ناموفق بود.",
        );
      }

      const foodsData: unknown = await foodsResponse.json();
      const updatedFoods = normalizeList<Food>(foodsData);

      setFoods(updatedFoods);

      const createdFood =
        updatedFoods.find((food) => food.id === result?.id) ??
        updatedFoods.find(
          (food) =>
            food.name.trim().toLocaleLowerCase("fa") ===
            name.toLocaleLowerCase("fa"),
        );

      if (createdFood) {
        setSelectedFoods((current) =>
          current.includes(createdFood.id)
            ? current
            : [...current, createdFood.id],
        );
      }

      setNewFoodName("");
      notify("غذا با موفقیت اضافه شد.");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "افزودن غذا ناموفق بود.",
      );
    } finally {
      setAddingFood(false);
    }
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (selectedPerson === "") {
      setError("ابتدا یک فرد را انتخاب کن.");
      return;
    }

    if (!selectedDate) {
      setError("تاریخ فعالیت را انتخاب کن.");
      return;
    }

    if (minutesBetween(startTime, endTime) === 0) {
      setError("زمان شروع و پایان نمی‌تواند یکسان باشد.");
      return;
    }

    setSaving(true);

    try {
      const params = new URLSearchParams({
        person_id: String(selectedPerson),
        entry_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
      });

      if (reportText.trim()) {
        params.set("report", reportText.trim());
      }

      // غذا اختیاری است؛ اگر چیزی انتخاب نشده باشد food_ids ارسال نمی‌شود.
      selectedFoods.forEach((id) => {
        params.append("food_ids", String(id));
      });

      const response = await fetch(`${API}/times?${params.toString()}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) || "ثبت فعالیت انجام نشد.",
        );
      }

      setReportText("");
      setSelectedFoods([]);

      await loadData();

      notify("فعالیت با موفقیت ثبت شد.");
      setView("history");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "ثبت فعالیت ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = personName.trim();

    if (!name) {
      setError("نام فرد را وارد کن.");
      return;
    }

    setAddingPersonSaving(true);

    try {
      // طبق OpenAPI فعلی، name در query parameter قرار دارد.
      const params = new URLSearchParams({ name });

      const response = await fetch(`${API}/people?${params.toString()}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) || "افزودن فرد انجام نشد.",
        );
      }

      const result = (await response.json()) as Person;

      await loadData();

      if (result?.id) {
        setSelectedPerson(result.id);
      }

      setPersonName("");
      setAddingPerson(false);

      notify("فرد جدید اضافه شد.");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "خطا در افزودن فرد.",
      );
    } finally {
      setAddingPersonSaving(false);
    }
  }

  function printReport() {
    window.print();
  }

  const pageTitle =
    view === "register"
      ? "ثبت فعالیت"
      : view === "history"
        ? "دفتر سوابق"
        : "گزارش هفتگی";

  return (
    <main className="app-shell" dir="rtl">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setView("register");
          }}
        >
          <span className="brand-mark">
            <Activity size={23} />
          </span>

          <span className="brand-copy">
            <strong>ActivityLog</strong>
            <small>دفتر ثبت روزانه</small>
          </span>
        </a>

        <div className="sidebar-label">فضای کاری</div>

        <nav className="nav-list">
          <button
            className={`nav-item ${view === "register" ? "active" : ""}`}
            onClick={() => setView("register")}
          >
            <LayoutDashboard size={19} />
            <span>ثبت فعالیت</span>
            <ChevronLeft size={16} className="nav-chevron" />
          </button>

          <button
            className={`nav-item ${view === "history" ? "active" : ""}`}
            onClick={() => setView("history")}
          >
            <FileText size={19} />
            <span>دفتر سوابق</span>
            <ChevronLeft size={16} className="nav-chevron" />
          </button>

          <button
            className={`nav-item ${view === "report" ? "active" : ""}`}
            onClick={() => setView("report")}
          >
            <FileText size={19} />
            <span>گزارش هفتگی</span>
            <ChevronLeft size={16} className="nav-chevron" />
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-dot" />
            <div>
              <strong>فضای محلی</strong>
              <small>اطلاعات روی سرور شما</small>
            </div>
          </div>

          <button className="theme-button" onClick={toggleTheme}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{dark ? "حالت روشن" : "حالت تاریک"}</span>
            <span className={`theme-switch ${dark ? "on" : ""}`}>
              <i />
            </span>
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>ActivityLog</span>
            <ChevronLeft size={14} />
            <strong>{pageTitle}</strong>
          </div>

          <div className="top-actions">
            <span className="today-pill">
              <CalendarDays size={15} />
              {jalaliDate(todayISO())}
            </span>

            <button
              className="icon-button"
              title="بارگذاری دوباره"
              onClick={() => void loadData()}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>

            <button
              className="avatar"
              title="مدیریت افراد"
              onClick={() => setAddingPerson(true)}
            >
              <Users size={18} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                مدیریت روزانه
              </div>

              <h1>
                {pageTitle}
                <span className="heading-period">.</span>
              </h1>

              <p>
                {view === "register"
                  ? "فعالیت‌ها را ثبت کن؛ سوابق مرتب و آماده گزارش می‌مانند."
                  : view === "history"
                    ? "جست‌وجو، بررسی و مرور تمام فعالیت‌های ثبت‌شده."
                    : "خلاصه‌ای از عملکرد هفته، با امکان چاپ یا خروجی گرفتن."}
              </p>
            </div>

            <div className="heading-date">
              <span>
                {weekday(view === "register" ? selectedDate : weekAnchor)}
              </span>
              <strong>
                {jalaliDate(view === "register" ? selectedDate : weekAnchor)}
              </strong>
            </div>
          </div>

          {error && (
            <div className="alert error-alert" role="alert">
              <X size={18} />
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                aria-label="بستن پیام خطا"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {notice && (
            <div className="alert success-alert" role="status">
              <Check size={18} />
              <span>{notice}</span>
            </div>
          )}

          {view === "register" && (
            <>
              <div className="stats-row">
                <Stat
                  icon={<Users size={19} />}
                  label="افراد ثبت‌شده"
                  value={toFa(people.length)}
                  detail="در فهرست مجموعه"
                />

                <Stat
                  icon={<Activity size={19} />}
                  label="فعالیت امروز"
                  value={toFa(todayEntries.length)}
                  detail="ثبت انجام‌شده"
                />

                <Stat
                  icon={<Clock3 size={19} />}
                  label="زمان ثبت‌شده امروز"
                  value={durationLabel(
                    todayEntries.reduce(
                      (sum, entry) =>
                        sum +
                        minutesBetween(entry.start_time, entry.end_time),
                      0,
                    ),
                  )}
                  detail="مجموع بازه‌ها"
                />
              </div>

              <div className="register-layout">
                <section className="panel form-panel">
                  <div className="panel-heading">
                    <div className="panel-title-wrap">
                      <span className="panel-icon green">
                        <Plus size={20} />
                      </span>

                      <div>
                        <h2>ثبت یک فعالیت</h2>
                        <p>اطلاعات را وارد و ذخیره کن</p>
                      </div>
                    </div>

                    <span className="required-label">
                      <i />
                      فیلدهای ضروری
                    </span>
                  </div>

                  <form onSubmit={saveEntry} className="entry-form">
                    <div className="field-group">
                      <label>
                        فرد موردنظر <span>*</span>
                      </label>

                      <div className="person-select-wrap">
                        <Users size={17} />

                        <select
                          value={selectedPerson}
                          onChange={(event) =>
                            setSelectedPerson(
                              event.target.value
                                ? Number(event.target.value)
                                : "",
                            )
                          }
                          required
                        >
                          <option value="">انتخاب از فهرست افراد</option>

                          {people.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                        </select>

                        <ChevronLeft
                          size={16}
                          className="select-chevron"
                        />
                      </div>

                      <button
                        type="button"
                        className="inline-add"
                        onClick={() => setAddingPerson(true)}
                      >
                        <Plus size={15} />
                        افزودن فرد جدید
                      </button>
                    </div>

                    <div className="field-group">
                      <label>
                        تاریخ فعالیت <span>*</span>
                      </label>

                      <div className="date-field">
                        <CalendarDays size={17} />
                        <PersianDatePicker
                          value={selectedDate}
                          onChange={setSelectedDate}
                          placeholder="تاریخ را انتخاب کن"
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label>
                        بازه زمانی <span>*</span>
                      </label>

                      <div className="time-grid">
                        <div className="time-box">
                          <span>شروع</span>
                          <input
                            aria-label="ساعت شروع"
                            type="time"
                            value={startTime}
                            onChange={(event) =>
                              setStartTime(event.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="time-connector">
                          <span>تا</span>
                        </div>

                        <div className="time-box">
                          <span>پایان</span>
                          <input
                            aria-label="ساعت پایان"
                            type="time"
                            value={endTime}
                            onChange={(event) =>
                              setEndTime(event.target.value)
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="duration-preview">
                        <Clock3 size={14} />
                        مدت این فعالیت:
                        <strong>
                          {durationLabel(
                            minutesBetween(startTime, endTime),
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* غذا در همان فرم فعالیت وارد و انتخاب می‌شود. */}
                    <div className="field-group">
                      <div className="label-row">
                        <label>
                          غذا <small>اختیاری · امکان انتخاب چند مورد</small>
                        </label>
                      </div>

                      <form
                        className="food-entry-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void addFood();
                        }}
                      >
                        <input
                          className="field-input"
                          type="text"
                          value={newFoodName}
                          onChange={(event) =>
                            setNewFoodName(event.target.value)
                          }
                          placeholder="نام غذای جدید را بنویس..."
                          aria-label="نام غذای جدید"
                          maxLength={100}
                        />

                        <button
                          className="secondary-button"
                          type="submit"
                          disabled={!newFoodName.trim() || addingFood}
                        >
                          {addingFood ? (
                            <RefreshCw size={16} className="spin" />
                          ) : (
                            <Plus size={16} />
                          )}
                          افزودن غذا
                        </button>
                      </form>

                      {foods.length > 0 && (
                        <div className="food-grid">
                          {foods.map((food) => {
                            const checked = selectedFoods.includes(food.id);

                            return (
                              <button
                                key={food.id}
                                type="button"
                                aria-pressed={checked}
                                className={`food-option ${
                                  checked ? "selected" : ""
                                }`}
                                onClick={() =>
                                  setSelectedFoods((current) =>
                                    checked
                                      ? current.filter(
                                          (id) => id !== food.id,
                                        )
                                      : [...current, food.id],
                                  )
                                }
                              >
                                <span className="food-check">
                                  {checked && <Check size={13} />}
                                </span>

                                <Utensils size={16} />
                                <span>{food.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <small className="field-hint">
                        غذای جدید ذخیره می‌شود و برای فعالیت‌های بعدی نیز
                        قابل انتخاب خواهد بود. انتخاب غذا الزامی نیست.
                      </small>
                    </div>

                    <div className="field-group">
                      <label>
                        گزارش یا توضیحات <small>اختیاری</small>
                      </label>

                      <textarea
                        className="field-input report-input"
                        rows={3}
                        value={reportText}
                        onChange={(event) =>
                          setReportText(event.target.value)
                        }
                        placeholder="توضیح کوتاهی درباره فعالیت، وضعیت یا نکته مهم بنویس..."
                      />
                    </div>

                    <div className="form-footer">
                      <span className="form-footnote">
                        <Check size={15} />
                        اطلاعات پس از ثبت در سوابق ذخیره می‌شود.
                      </span>

                      <button
                        className="primary-button"
                        type="submit"
                        disabled={saving || loading}
                      >
                        {saving ? (
                          <RefreshCw size={17} className="spin" />
                        ) : (
                          <Plus size={18} />
                        )}

                        {saving ? "در حال ثبت..." : "ثبت فعالیت"}
                      </button>
                    </div>
                  </form>
                </section>

                <aside className="right-column">
                  <section className="panel people-panel">
                    <div className="panel-heading compact">
                      <div className="panel-title-wrap">
                        <span className="panel-icon lavender">
                          <Users size={19} />
                        </span>

                        <div>
                          <h2>افراد مجموعه</h2>
                          <p>{toFa(people.length)} نفر در فهرست</p>
                        </div>
                      </div>

                      <button
                        className="small-icon-button"
                        title="افزودن فرد"
                        onClick={() => setAddingPerson(true)}
                      >
                        <Plus size={17} />
                      </button>
                    </div>

                    <div className="people-list">
                      {people.slice(0, 7).map((person, index) => (
                        <button
                          key={person.id}
                          className={`person-row ${
                            selectedPerson === person.id ? "chosen" : ""
                          }`}
                          onClick={() => setSelectedPerson(person.id)}
                        >
                          <span className={`person-avatar tone-${index % 5}`}>
                            {person.name.trim().charAt(0)}
                          </span>

                          <span className="person-info">
                            <strong>{person.name}</strong>
                            <small>
                              {toFa(
                                entries.filter(
                                  (entry) => entry.person_id === person.id,
                                ).length,
                              )}{" "}
                              فعالیت ثبت‌شده
                            </small>
                          </span>

                          {selectedPerson === person.id ? (
                            <Check size={16} className="person-check" />
                          ) : (
                            <ChevronLeft
                              size={16}
                              className="person-arrow"
                            />
                          )}
                        </button>
                      ))}

                      {!people.length && (
                        <div className="empty-state small-empty">
                          <Users size={22} />
                          <span>هنوز فردی ثبت نشده</span>
                        </div>
                      )}
                    </div>

                    {people.length > 7 && (
                      <button
                        className="text-link"
                        onClick={() => setView("history")}
                      >
                        مشاهده سوابق همه افراد
                        <ChevronLeft size={15} />
                      </button>
                    )}
                  </section>

                  <section className="week-card">
                    <div className="week-card-top">
                      <span className="week-symbol">
                        <CalendarDays size={18} />
                      </span>
                      <span>نمای کلی هفته</span>
                    </div>

                    <strong className="week-total">
                      {durationLabel(weekMinutes)}
                    </strong>

                    <p>زمان فعالیت‌های ثبت‌شده در این هفته</p>

                    <div className="week-divider" />

                    <div className="week-metric">
                      <span>تعداد فعالیت</span>
                      <strong>{toFa(weekEntries.length)}</strong>
                    </div>

                    <div className="week-metric">
                      <span>روزهای دارای فعالیت</span>
                      <strong>
                        {toFa(
                          new Set(
                            weekEntries.map((entry) => entry.entry_date),
                          ).size,
                        )}{" "}
                        از ۷
                      </strong>
                    </div>

                    <button
                      className="week-link"
                      onClick={() => setView("report")}
                    >
                      مشاهده گزارش هفتگی
                      <ChevronLeft size={16} />
                    </button>
                  </section>
                </aside>
              </div>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div className="panel-title-wrap">
                    <span className="panel-icon amber">
                      <Clock3 size={19} />
                    </span>

                    <div>
                      <h2>آخرین فعالیت‌ها</h2>
                      <p>جدیدترین موارد ثبت‌شده در دفتر</p>
                    </div>
                  </div>

                  <button
                    className="text-link"
                    onClick={() => setView("history")}
                  >
                    دفتر کامل
                    <ChevronLeft size={15} />
                  </button>
                </div>

                <EntryTable
                  entries={[...entries]
                    .sort((a, b) =>
                      `${b.entry_date} ${b.start_time}`.localeCompare(
                        `${a.entry_date} ${a.start_time}`,
                      ),
                    )
                    .slice(0, 5)}
                  people={people}
                />
              </section>
            </>
          )}

          {view === "history" && (
            <section className="panel history-panel">
              <div className="panel-heading">
                <div className="panel-title-wrap">
                  <span className="panel-icon green">
                    <Activity size={19} />
                  </span>

                  <div>
                    <h2>دفتر فعالیت‌ها</h2>
                    <p>فهرست قابل جست‌وجوی تمام سوابق</p>
                  </div>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => downloadCSV(visibleEntries, people)}
                >
                  <Download size={16} />
                  خروجی CSV
                </button>
              </div>

              <div className="filters">
                <div className="search-field">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="جست‌وجوی نام، غذا یا گزارش..."
                  />
                </div>

                <div className="filter-date">
                  <CalendarDays size={16} />
                  <PersianDatePicker
                    value={filterDate}
                    onChange={setFilterDate}
                    placeholder="همه تاریخ‌ها"
                  />
                </div>

                <select
                  className="filter-select"
                  value={filterPerson}
                  onChange={(event) =>
                    setFilterPerson(
                      event.target.value
                        ? Number(event.target.value)
                        : "",
                    )
                  }
                >
                  <option value="">همه افراد</option>

                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>

                <button
                  className="icon-button filter-reset"
                  title="پاک‌کردن فیلترها"
                  onClick={() => {
                    setSearch("");
                    setFilterDate("");
                    setFilterPerson("");
                  }}
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              <EntryTable entries={visibleEntries} people={people} />

              <div className="table-footer">
                <span>
                  {toFa(visibleEntries.length)} رکورد نمایش داده می‌شود
                </span>

                <span>
                  مجموع زمان:{" "}
                  <strong>
                    {durationLabel(
                      visibleEntries.reduce(
                        (sum, entry) =>
                          sum +
                          minutesBetween(
                            entry.start_time,
                            entry.end_time,
                          ),
                        0,
                      ),
                    )}
                  </strong>
                </span>
              </div>
            </section>
          )}

          {view === "report" && (
            <>
              <div className="report-toolbar">
                <div>
                  <h2>گزارش هفتگی</h2>
                  <p>بازه هفته را تغییر بده یا گزارش را چاپ کن.</p>
                </div>

                <div className="report-actions">
                  <button
                    className="secondary-button"
                    onClick={() => downloadCSV(weekEntries, people)}
                  >
                    <Download size={16} />
                    خروجی CSV
                  </button>

                  <button className="primary-button" onClick={printReport}>
                    <Printer size={17} />
                    چاپ / ذخیره PDF
                  </button>
                </div>
              </div>

              <section className="panel report-filter-panel">
                <button
                  className="icon-button"
                  title="هفته قبل"
                  onClick={() =>
                    setWeekAnchor(shiftDate(weekAnchor, -7))
                  }
                >
                  <ChevronRight size={18} />
                </button>

                <div className="report-week-date">
                  <CalendarDays size={19} />
                  <div>
                    <small>هفته انتخاب‌شده</small>
                    <strong>
                      {jalaliDate(weekDates[0])}
                      <span> تا </span>
                      {jalaliDate(weekDates[6])}
                    </strong>
                  </div>
                </div>

                <PersianDatePicker
                  value={weekAnchor}
                  onChange={setWeekAnchor}
                  placeholder="انتخاب روز از هفته"
                />

                <button
                  className="icon-button"
                  title="هفته بعد"
                  onClick={() =>
                    setWeekAnchor(shiftDate(weekAnchor, 7))
                  }
                >
                  <ChevronLeft size={18} />
                </button>
              </section>

              <div className="stats-row report-stats">
                <Stat
                  icon={<Clock3 size={19} />}
                  label="مجموع زمان"
                  value={durationLabel(weekMinutes)}
                  detail="در بازه انتخاب‌شده"
                />

                <Stat
                  icon={<Activity size={19} />}
                  label="فعالیت‌ها"
                  value={toFa(weekEntries.length)}
                  detail="کل ثبت‌های هفته"
                />

                <Stat
                  icon={<Users size={19} />}
                  label="افراد فعال"
                  value={toFa(
                    new Set(weekEntries.map((entry) => entry.person_id))
                      .size,
                  )}
                  detail="دارای فعالیت ثبت‌شده"
                />
              </div>

              <section className="panel report-document">
                <div className="report-doc-header">
                  <span className="report-logo">
                    <Activity size={22} />
                  </span>

                  <div>
                    <h2>گزارش فعالیت هفتگی</h2>
                    <p>ActivityLog · دفتر ثبت روزانه</p>
                  </div>

                  <span className="report-stamp">گزارش داخلی</span>
                </div>

                <div className="report-period">
                  <span>بازه گزارش</span>
                  <strong>
                    {jalaliDate(weekDates[0])} تا{" "}
                    {jalaliDate(weekDates[6])}
                  </strong>
                </div>

                <div className="report-day-list">
                  {weekDates.map((date, index) => {
                    const dayEntries = weekEntries.filter(
                      (entry) => entry.entry_date === date,
                    );

                    const minutes = dailyMinutes[index];

                    const width = weekMinutes
                      ? (minutes / maximumDailyMinutes) * 100
                      : 0;

                    return (
                      <div className="report-day" key={date}>
                        <div className="report-day-date">
                          <strong>{weekday(date)}</strong>
                          <small>
                            {jalaliDate(date, { month: "short" })}
                          </small>
                        </div>

                        <div
                          className="report-day-bar"
                          role="img"
                          aria-label={`مدت فعالیت ${weekday(date)}`}
                        >
                          <i style={{ width: `${width}%` }} />
                        </div>

                        <span className="report-day-count">
                          {toFa(dayEntries.length)} فعالیت
                        </span>

                        <strong className="report-day-duration">
                          {durationLabel(minutes)}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                <div className="report-table-title">
                  <h3>جزئیات فعالیت‌ها</h3>
                  <span>{toFa(weekEntries.length)} رکورد</span>
                </div>

                <EntryTable
                  entries={[...weekEntries].sort((a, b) =>
                    `${a.entry_date} ${a.start_time}`.localeCompare(
                      `${b.entry_date} ${b.start_time}`,
                    ),
                  )}
                  people={people}
                />

                <div className="report-signature">
                  <span>تهیه گزارش: ................................</span>
                  <span>تاریخ تهیه: {jalaliDate(todayISO())}</span>
                </div>
              </section>
            </>
          )}

          <footer className="app-footer">
            <span>
              <span className="footer-dot" />
              سامانه ثبت محلی فعالیت‌ها
            </span>

            <span>
              ActivityLog <b>·</b> نسخه اولیه
            </span>
          </footer>
        </div>
      </section>

      {addingPerson && (
        <div
          className="modal-backdrop"
          onClick={() => setAddingPerson(false)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-person-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setAddingPerson(false)}
              aria-label="بستن"
              type="button"
            >
              <X size={18} />
            </button>

            <span className="modal-icon">
              <Users size={23} />
            </span>

            <h2 id="add-person-title">افزودن فرد جدید</h2>
            <p>نام فرد را وارد کن تا به فهرست مجموعه اضافه شود.</p>

            <form onSubmit={createPerson}>
              <label htmlFor="person-name">نام و نام خانوادگی</label>

              <input
                id="person-name"
                className="field-input"
                autoFocus
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                placeholder="مثلاً امیر رضایی"
                required
              />

              <button
                className="primary-button modal-submit"
                type="submit"
                disabled={addingPersonSaving}
              >
                {addingPersonSaving ? (
                  <RefreshCw size={17} className="spin" />
                ) : (
                  <Plus size={17} />
                )}

                {addingPersonSaving
                  ? "در حال افزودن..."
                  : "افزودن به فهرست"}
              </button>
            </form>
          </section>
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <span className="loader" />
          در حال دریافت اطلاعات...
        </div>
      )}
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>

      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function EntryTable({
  entries,
  people,
}: {
  entries: TimeEntry[];
  people: Person[];
}) {
  if (!entries.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <CalendarDays size={24} />
        </span>

        <strong>هنوز فعالیتی ثبت نشده</strong>

        <p>
          وقتی فعالیتی ثبت شود، جزئیات آن در این بخش نمایش داده می‌شود.
        </p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>فرد</th>
            <th>تاریخ</th>
            <th>بازه زمانی</th>
            <th>مدت</th>
            <th>غذا</th>
            <th>گزارش</th>
          </tr>
        </thead>

        <tbody>
          {entries.map((entry) => {
            const person = people.find(
              (item) => item.id === entry.person_id,
            );

            const foodNames = entryFoodNames(entry);

            return (
              <tr key={entry.id}>
                <td>
                  <div className="table-person">
                    <span className="table-avatar">
                      {person?.name?.charAt(0) || "؟"}
                    </span>

                    <strong>
                      {person?.name || `فرد ${toFa(entry.person_id)}`}
                    </strong>
                  </div>
                </td>

                <td>
                  <div className="date-cell">
                    <strong>
                      {jalaliDate(entry.entry_date, {
                        day: "numeric",
                      })}
                    </strong>

                    <small>
                      {jalaliDate(entry.entry_date, {
                        month: "long",
                        year: "numeric",
                      })}
                    </small>
                  </div>
                </td>

                <td>
                  <span className="time-range">
                    <span>{toFa(entry.start_time)}</span>
                    <i>–</i>
                    <span>{toFa(entry.end_time)}</span>
                  </span>
                </td>

                <td>
                  <span className="duration-chip">
                    {durationLabel(
                      minutesBetween(entry.start_time, entry.end_time),
                    )}
                  </span>
                </td>

                <td>
                  <div className="food-tags">
                    {foodNames.length ? (
                      foodNames.map((name, index) => (
                        <span key={`${entry.id}-${index}`}>{name}</span>
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </td>

                <td>
                  <span
                    className="report-cell"
                    title={entry.report || ""}
                  >
                    {entry.report || "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
