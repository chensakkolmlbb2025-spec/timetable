export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function parseDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00")
}

export function formatDisplayDate(dateString: string): string {
  const date = parseDate(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function getWeekDates(date: Date): Date[] {
  const current = new Date(date)
  const first = current.getDate() - current.getDay() + 1 // Monday
  const dates: Date[] = []

  for (let i = 0; i < 7; i++) {
    const day = new Date(current)
    day.setDate(first + i)
    dates.push(day)
  }

  return dates
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2)
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}
