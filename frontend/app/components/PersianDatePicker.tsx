
"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function PersianDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className = "",
}: Props) {
  return (
    <DatePicker
      value={value || ""}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      format="YYYY/MM/DD"
      placeholder={placeholder}
      className={className}
      inputClass="field-input"
      editable={false}
      onChange={(date) => {
        if (!date) {
          onChange("");
          return;
        }

        const jsDate = date.toDate();
        const year = jsDate.getFullYear();
        const month = String(jsDate.getMonth() + 1).padStart(2, "0");
        const day = String(jsDate.getDate()).padStart(2, "0");

        onChange(`${year}-${month}-${day}`);
      }}
    />
  );
}
