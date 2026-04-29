"use client";

import React, { useState, useEffect, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, TimePicker, ConfigProvider } from "antd";
import locale from "antd/locale/en_US";
import "dayjs/locale/en";
import { Calendar, Clock } from "lucide-react";

dayjs.locale("en");

type Step = "checkin-date" | "checkin-time" | "checkout-date" | "checkout-time" | "complete";

interface BookingDateTimePickerProps {
  onChange?: (checkin: Dayjs | null, checkout: Dayjs | null) => void;
  defaultCheckin?: Dayjs;
  defaultCheckout?: Dayjs;
}

const BookingDateTimePicker: React.FC<BookingDateTimePickerProps> = ({
  onChange,
  defaultCheckin,
  defaultCheckout,
}) => {
  // Date/time state
  const [checkinDate, setCheckinDate] = useState<Dayjs | null>(defaultCheckin?.startOf("day") || null);
  const [checkinTime, setCheckinTime] = useState<Dayjs | null>(defaultCheckin || null);
  const [checkoutDate, setCheckoutDate] = useState<Dayjs | null>(defaultCheckout?.startOf("day") || null);
  const [checkoutTime, setCheckoutTime] = useState<Dayjs | null>(defaultCheckout || null);

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    if (defaultCheckin && defaultCheckout) return "complete";
    if (defaultCheckin) return "checkout-date";
    return "checkin-date";
  });

  // Controlled open states for each picker
  const [isCheckinDateOpen, setIsCheckinDateOpen] = useState(false);
  const [isCheckinTimeOpen, setIsCheckinTimeOpen] = useState(false);
  const [isCheckoutDateOpen, setIsCheckoutDateOpen] = useState(false);
  const [isCheckoutTimeOpen, setIsCheckoutTimeOpen] = useState(false);

  // Derived complete date-times
  const checkinDateTime = checkinDate && checkinTime
    ? checkinDate.hour(checkinTime.hour()).minute(checkinTime.minute()).second(0)
    : null;

  const checkoutDateTime = checkoutDate && checkoutTime
    ? checkoutDate.hour(checkoutTime.hour()).minute(checkoutTime.minute()).second(0)
    : null;

  // Notify parent (with memo to avoid infinite loop)
  const prevCheckinRef = useRef<Dayjs | null>(null);
  const prevCheckoutRef = useRef<Dayjs | null>(null);
  useEffect(() => {
    if (
      (checkinDateTime && !prevCheckinRef.current?.isSame(checkinDateTime)) ||
      (checkoutDateTime && !prevCheckoutRef.current?.isSame(checkoutDateTime)) ||
      (checkinDateTime === null && prevCheckinRef.current !== null) ||
      (checkoutDateTime === null && prevCheckoutRef.current !== null)
    ) {
      onChange?.(checkinDateTime, checkoutDateTime);
      prevCheckinRef.current = checkinDateTime;
      prevCheckoutRef.current = checkoutDateTime;
    }
  }, [checkinDateTime, checkoutDateTime, onChange]);

  // Automatically open the relevant picker when a step becomes active
  useEffect(() => {
    // Close all pickers first
    setIsCheckinDateOpen(false);
    setIsCheckinTimeOpen(false);
    setIsCheckoutDateOpen(false);
    setIsCheckoutTimeOpen(false);

    // Open the one corresponding to the current step
    if (currentStep === "checkin-date") setIsCheckinDateOpen(true);
    if (currentStep === "checkin-time") setIsCheckinTimeOpen(true);
    if (currentStep === "checkout-date") setIsCheckoutDateOpen(true);
    if (currentStep === "checkout-time") setIsCheckoutTimeOpen(true);
  }, [currentStep]);

  // Handlers
  const handleCheckinDateChange = (date: Dayjs | null) => {
    setCheckinDate(date);
    if (date) {
      setCurrentStep("checkin-time");
    } else {
      setCurrentStep("checkin-date");
    }
  };

  const handleCheckinTimeChange = (time: Dayjs | null) => {
    setCheckinTime(time);
    if (time) {
      setCurrentStep("checkout-date");
    } else {
      setCurrentStep("checkin-time");
    }
  };

  const handleCheckoutDateChange = (date: Dayjs | null) => {
    setCheckoutDate(date);
    if (date) {
      setCurrentStep("checkout-time");
    } else {
      setCurrentStep("checkout-date");
    }
  };

  const handleCheckoutTimeChange = (time: Dayjs | null) => {
    setCheckoutTime(time);
    if (time) {
      setCurrentStep("complete");
    } else {
      setCurrentStep("checkout-time");
    }
  };

  // Disable rules
  const disabledCheckoutDate = (current: Dayjs) =>
    current.isBefore(checkinDate || dayjs(), "day");

  const disabledCheckoutTime = () => {
    if (!checkinDateTime || !checkoutDate?.isSame(checkinDate, "day")) return {};
    return {
      disabledHours: () => Array.from({ length: checkinDateTime.hour() }, (_, i) => i),
      disabledMinutes: (hour: number) =>
        hour === checkinDateTime.hour()
          ? Array.from({ length: checkinDateTime.minute() + 1 }, (_, i) => i)
          : [],
    };
  };

  const formatDisplay = (dt: Dayjs | null) => dt?.format("DD MMM HH:mm") || "";

  const isCheckinActive = ["checkin-date", "checkin-time"].includes(currentStep);
  const isCheckoutActive = ["checkout-date", "checkout-time"].includes(currentStep);
  const showCheckout = checkinDateTime !== null;

  // Helper to render picker with controlled open state
  const renderDatePicker = (
    value: Dayjs | null,
    onChange: (date: Dayjs | null) => void,
    disabledDate?: (current: Dayjs) => boolean,
    placeholder: string = "Select date"
  ) => (
    <DatePicker
      value={value}
      onChange={onChange}
      disabledDate={disabledDate}
      format="DD MMM YYYY"
      placeholder={placeholder}
      className="w-full border-none shadow-none text-center"
      allowClear={true}
      suffixIcon={<Calendar className="text-baby-blue-500 h-4 w-4" />}
      open={true}
      getPopupContainer={(trigger) => trigger.parentElement!}
    />
  );

  const renderTimePicker = (
    value: Dayjs | null,
    onChange: (time: Dayjs | null) => void,
    disabledTime?: () => any,
    placeholder: string = "Select time"
  ) => (
    <TimePicker
      value={value}
      onChange={onChange}
      disabledTime={disabledTime}
      format="HH:mm"
      minuteStep={15}
      placeholder={placeholder}
      className="w-full border-none shadow-none text-center text-baby-blue-500"
      allowClear={true}
      suffixIcon={<Clock className="text-baby-blue-500 h-4 w-4" />}
      open={true}
      getPopupContainer={(trigger) => trigger.parentElement!}
    />
  );

  return (
    <>
      <div className="flex flex-1 flex-col lg:flex-row gap-4">
        {/* CHECK IN BOX */}
        <div
          className={`flex-1 border rounded-2xl bg-white transition-all 
            ${isCheckinActive ? "border-baby-blue-500" : "border-gray-200"}`}
        >
          <div className="relative  px-5">
            <div className="absolute top-3 left-4 text-[11px] font-semibold text-baby-blue-500">CHECK IN</div>
            <div className="pt-6 min-h-[48px]">
              {currentStep === "checkin-date" &&
                renderDatePicker(checkinDate, handleCheckinDateChange, undefined, "Select date")}
              {currentStep === "checkin-time" &&
                renderTimePicker(checkinTime, handleCheckinTimeChange, undefined, "Select time")}
              {!["checkin-date", "checkin-time"].includes(currentStep) && checkinDateTime && (
                <div
                  className="text-center flex items-center justify-between text-sm font-medium text-gray-800 py-4 cursor-pointer  rounded"
                  onClick={() => setCurrentStep("checkin-date")}
                >
                  {formatDisplay(checkinDateTime)}
                  <Calendar size={20}/>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CHECK OUT BOX */}
        <div
          className={`flex-1 border rounded-2xl bg-white transition-all 
            ${isCheckoutActive && showCheckout ? "border-baby-blue-500 " : "border-gray-200"}
            ${!showCheckout ? "opacity-50" : ""}`}
        >
          <div className="relative  px-5 ">
            <div className="absolute top-3 left-4 text-[11px] font-semibold text-baby-blue-500">CHECK OUT</div>
            <div className="pt-6 min-h-[48px]">
              {!showCheckout ? (
                <div className="text-center text-gray-400 text-xs py-8">Select check-in first</div>
              ) : currentStep === "checkout-date" ? (
                renderDatePicker(checkoutDate, handleCheckoutDateChange, disabledCheckoutDate, "Select date")
              ) : currentStep === "checkout-time" ? (
                renderTimePicker(checkoutTime, handleCheckoutTimeChange, disabledCheckoutTime, "Select time")
              ) : (
                checkoutDateTime && (
                  <div
                    className="text-center text-sm  flex items-center justify-between font-medium text-gray-800 py-4 cursor-pointer rounded"
                    onClick={() => setCurrentStep("checkout-date")}
                  >
                    {formatDisplay(checkoutDateTime)}
                     <Calendar size={20}/>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingDateTimePicker;