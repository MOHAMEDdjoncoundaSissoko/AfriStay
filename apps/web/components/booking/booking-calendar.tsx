'use client';

import { useState } from 'react';

interface BlockedDate {
  date: string;
  status: string;
}

interface BookingCalendarProps {
  propertyId: string;
  unavailableDates: BlockedDate[];
  checkIn: Date | null;
  checkOut: Date | null;
  onDateSelect: (date: Date) => void;
}

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAY_NAMES = ['Di','Lu','Ma','Me','Je','Sa','Ve'];

export function BookingCalendar({ propertyId, unavailableDates, checkIn, checkOut, onDateSelect }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const blockedSet = new Set(unavailableDates.map((d) => d.date));
  const today = new Date(); today.setHours(0,0,0,0);

  function isBlocked(date: Date): boolean {
    const str = date.toISOString().split('T')[0];
    return blockedSet.has(str);
  }

  function isInRange(date: Date): boolean {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  }

  function isCheckIn(date: Date): boolean {
    if (!checkIn) return false;
    return date.getTime() === checkIn.getTime();
  }

  function isCheckOut(date: Date): boolean {
    if (!checkOut) return false;
    return date.getTime() === checkOut.getTime();
  }

  function isPast(date: Date): boolean {
    return date < today;
  }

  function handleDateClick(date: Date) {
    if (isPast(date) || isBlocked(date)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onDateSelect(date);
    } else if (date <= checkIn) {
      onDateSelect(date);
    } else {
      onDateSelect(date);
    }
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(currentYear, currentMonth, d));

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth} type="button"><i className="fa-solid fa-chevron-left" /></button>
        <h4>{MONTH_NAMES[currentMonth]} {currentYear}</h4>
        <button className="cal-nav" onClick={nextMonth} type="button"><i className="fa-solid fa-chevron-right" /></button>
      </div>
      <div className="cal-grid">
        {DAY_NAMES.map((d) => <div key={d} className="cal-day-name">{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} className="cal-day empty" />;
          const past = isPast(date);
          const blocked = isBlocked(date);
          const inRange = isInRange(date);
          const isCI = isCheckIn(date);
          const isCO = isCheckOut(date);
          const disabled = past || blocked;

          let cls = 'cal-day';
          if (disabled) cls += ' disabled';
          else if (isCI) cls += ' range-start';
          else if (isCO) cls += ' range-end';
          else if (inRange) cls += ' in-range';
          if (date.getTime() === today.getTime() && !isCI && !isCO) cls += ' today';

          return (
            <div
              key={date.toISOString()}
              className={cls}
              onClick={() => handleDateClick(date)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}