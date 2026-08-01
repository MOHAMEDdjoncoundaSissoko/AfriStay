'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api/client';

interface BlockedDate {
  date: string;
  status: string;
}

interface BookingCalendarProps {
  propertyId: string;
  checkIn: Date | null;
  checkOut: Date | null;
  onDateSelect: (date: Date) => void;
}

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAY_NAMES = ['Di','Lu','Ma','Me','Je','Sa','Ve'];

export function BookingCalendar({ propertyId, checkIn, checkOut, onDateSelect }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [unavailableDates, setUnavailableDates] = useState<BlockedDate[]>([]);

  // 👉 NOUVEAU : On charge les dates INDISPONIBLES à chaque fois qu'on change de mois
  useEffect(() => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const y = String(currentYear);
    apiRequest<BlockedDate[]>(`/api/properties/${propertyId}/availability?month=${m}&year=${y}`)
      .then(setUnavailableDates)
      .catch(() => {});
  }, [propertyId, currentMonth, currentYear]); // Les dépendances ici sont la clé !

  // On extrait juste "2026-08-01" au cas où l'API renvoie "2026-08-01T00:00:00.000Z"
  const blockedSet = new Set(
    unavailableDates.map((d) => d.date.includes('T') ? d.date.split('T')[0] : d.date)
  );
  const today = new Date(); today.setHours(0,0,0,0);

  function isBlocked(date: Date): boolean {
    // On utilise l'heure LOCALE, pas UTC, pour éviter le décalage de fuseau
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const str = `${year}-${month}-${day}`;
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
    onDateSelect(date);
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