import assert from "node:assert/strict"
import test from "node:test"
import { addCalendarDays, calendarDaysBetween, inclusiveCalendarDays, programScheduleError } from "../../lib/competitions/program-calendar.ts"

const competition = { date_debut: "2028-07-26", date_fin: "2028-08-11" }

test("calcule les durées en jours calendaires de manière inclusive", () => {
  assert.equal(calendarDaysBetween("2028-07-24", "2028-07-27"), 3)
  assert.equal(inclusiveCalendarDays("2028-07-24", "2028-07-27"), 4)
  assert.equal(addCalendarDays("2028-07-31", 1), "2028-08-01")
})

test("accepte une épreuve avant l’ouverture et le jour de la clôture", () => {
  assert.equal(programScheduleError({ date_debut: "2028-07-24", date_fin: "2028-07-27" }, competition as never), null)
  assert.equal(programScheduleError({ date_debut: "2028-08-05", date_fin: "2028-08-11" }, competition as never), null)
})

test("refuse toute date dépassant la cérémonie de clôture", () => {
  assert.match(programScheduleError({ date_debut: "2028-08-12", date_fin: "2028-08-13" }, competition as never) || "", /commencer après/)
  assert.match(programScheduleError({ date_debut: "2028-08-10", date_fin: "2028-08-12" }, competition as never) || "", /terminer après/)
})

test("conserve les programmes sans dates dans l’état à planifier", () => {
  assert.equal(programScheduleError({ date_debut: "", date_fin: "" }, competition as never), null)
  assert.match(programScheduleError({ date_debut: "", date_fin: "2028-08-01" }, competition as never) || "", /date de début/)
})
