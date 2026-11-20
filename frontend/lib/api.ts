import type {
  Food,
  Person,
  TimeEntry,
  TimeEntryInput,
} from "@/lib/types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "اتصال به سرور برقرار نشد. وضعیت FastAPI و آدرس API را بررسی کن.",
    );
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body || `HTTP ${response.status}`;

    try {
      const parsed: unknown = JSON.parse(body);

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "detail" in parsed
      ) {
        const detail = (parsed as { detail: unknown }).detail;
        message =
          typeof detail === "string"
            ? detail
            : JSON.stringify(detail);
      }
    } catch {
      // پاسخ خطا ممکن است JSON نباشد.
    }

    throw new Error(`خطای ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (response.status === 205) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("پاسخ سرور JSON نیست.");
  }

  return (await response.json()) as T;
}

function query(
  values: Record<string, string | number | undefined>,
  foodIds?: number[],
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  for (const id of foodIds ?? []) {
    params.append("food_ids", String(id));
  }

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function entryParams(entry: TimeEntryInput) {
  return {
    person_id: entry.person_id,
    entry_date: entry.entry_date,
    start_time: entry.start_time,
    end_time: entry.end_time,
    report: entry.report?.trim() || undefined,
  };
}

export const api = {
  health: () =>
    request<unknown>("/health"),

  people: {
    list: () =>
      request<Person[]>("/people"),

    create: (name: string) =>
      request<Person>(
        `/people${query({ name: name.trim() })}`,
        { method: "POST" },
      ),

    update: (id: number, name: string) =>
      request<Person>(
        `/people/${id}${query({ name: name.trim() })}`,
        { method: "PUT" },
      ),

    delete: (id: number) =>
      request<void>(`/people/${id}`, {
        method: "DELETE",
      }),
  },

  foods: {
    list: () =>
      request<Food[]>("/foods"),

    create: (name: string) =>
      request<Food>(
        `/foods${query({ name: name.trim() })}`,
        { method: "POST" },
      ),

    update: (id: number, name: string) =>
      request<Food>(
        `/foods/${id}${query({ name: name.trim() })}`,
        { method: "PUT" },
      ),

    delete: (id: number) =>
      request<void>(`/foods/${id}`, {
        method: "DELETE",
      }),
  },

  times: {
    list: () =>
      request<TimeEntry[]>("/times"),

    create: (entry: TimeEntryInput) =>
      request<TimeEntry>(
        `/times${query(entryParams(entry), entry.food_ids)}`,
        { method: "POST" },
      ),

    update: (id: number, entry: TimeEntryInput) =>
      request<TimeEntry>(
        `/time/${id}${query(entryParams(entry), entry.food_ids)}`,
        { method: "PUT" },
      ),

    delete: (id: number) =>
      request<void>(`/time/${id}`, {
        method: "DELETE",
      }),
  },
};