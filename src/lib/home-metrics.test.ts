import { describe, expect, it } from "vitest";
import type { HomeFollowUpParticipant, OrganizationInvitation, SeatStatus } from "@/lib/api/types";
import {
  canRemind,
  followUpLabels,
  formatExpiresIn,
  followUpCourseDetail,
  followUpProgressText,
  formatLastSeen,
  pendingInvitations,
} from "@/lib/home-metrics";

const NOW = new Date("2026-11-20T15:00:00");

function invitation(
  email: string,
  invitationDeadline: string | null,
  status: SeatStatus = "INVITED",
): OrganizationInvitation {
  return {
    purchaseId: "p",
    courseId: "c",
    courseName: "LSA Salud",
    purchaseStatus: "PAID",
    invitationDeadline,
    seat: {
      id: email,
      email,
      status,
      invitedAt: "2026-11-10T12:00:00Z",
      lastReminderAt: null,
      autoReminderSentAt: null,
      activatedAt: null,
      accessExpiresAt: null,
      revokedAt: null,
      userId: null,
      userName: null,
      canEditEmail: true,
      nextReminderAvailableAt: null,
    },
  };
}

function participant(overrides: Partial<HomeFollowUpParticipant>): HomeFollowUpParticipant {
  return {
    userId: "u",
    name: "Ana",
    lastName: "Paz",
    avatarUrl: null,
    reasons: [],
    courses: [],
    progressPercentage: 0,
    lastActivityAt: null,
    accessExpiresAt: null,
    lastReminderAt: null,
    nextReminderAvailableAt: null,
    ...overrides,
  };
}

describe("pendingInvitations", () => {
  it("keeps the acceptable ones, about to expire first", () => {
    const rows = [
      invitation("late@x.com", "2026-11-28T12:00:00"),
      invitation("expired@x.com", "2026-11-25T12:00:00", "INVITATION_EXPIRED"),
      invitation("b@x.com", "2026-11-22T12:00:00"),
      invitation("a@x.com", "2026-11-22T12:00:00"),
      invitation("past@x.com", "2026-11-20T10:00:00"),
    ];

    expect(pendingInvitations(rows, NOW).map((r) => r.seat.email)).toEqual([
      "a@x.com",
      "b@x.com",
      "late@x.com",
    ]);
  });

  it("puts invitations without a deadline last", () => {
    const rows = [invitation("none@x.com", null), invitation("soon@x.com", "2026-11-21T12:00:00")];

    expect(pendingInvitations(rows, NOW).map((r) => r.seat.email)).toEqual([
      "soon@x.com",
      "none@x.com",
    ]);
  });
});

describe("canRemind", () => {
  it("allows it with no cooldown or once it ended", () => {
    expect(canRemind(null, NOW)).toBe(true);
    expect(canRemind("2026-11-20T14:00:00", NOW)).toBe(true);
    expect(canRemind("2026-11-20T16:00:00", NOW)).toBe(false);
  });
});

describe("formatExpiresIn", () => {
  it("counts calendar days", () => {
    expect(formatExpiresIn("2026-11-20T23:00:00", NOW)).toBe("Vence hoy");
    expect(formatExpiresIn("2026-11-21T01:00:00", NOW)).toBe("Vence mañana");
    expect(formatExpiresIn("2026-11-25T08:00:00", NOW)).toBe("Vence en 5 días");
  });
});

describe("followUpLabels", () => {
  it("describes every reason in order", () => {
    expect(
      followUpLabels(
        participant({
          reasons: ["ACCESS_EXPIRING", "INACTIVE"],
          accessExpiresAt: "2026-11-22T12:00:00",
          lastActivityAt: "2026-11-10T12:00:00",
        }),
        NOW,
      ),
    ).toEqual(["Acceso: vence en 2 días", "Sin actividad · hace 10 días"]);
  });

  it("says when the access ends with little progress", () => {
    expect(
      followUpLabels(
        participant({
          reasons: ["EXPIRING_WITH_LOW_PROGRESS"],
          accessExpiresAt: "2026-11-25T12:00:00",
        }),
        NOW,
      ),
    ).toEqual(["Menos del 50% · vence en 5 días"]);
  });

  it("says who never started", () => {
    expect(followUpLabels(participant({ reasons: ["INACTIVE"] }), NOW)).toEqual(["Nunca empezó"]);
  });
});

describe("formatLastSeen", () => {
  it("names the last day with activity", () => {
    expect(formatLastSeen("2026-11-20T09:00:00", NOW)).toBe("Últ. vez hoy");
    expect(formatLastSeen("2026-11-19T22:00:00", NOW)).toBe("Últ. vez ayer");
    expect(formatLastSeen("2026-11-17T10:00:00", NOW)).toBe("Últ. vez hace 3 días");
    expect(formatLastSeen(null, NOW)).toBe("Sin actividad");
  });
});

describe("followUpProgressText", () => {
  const salud = {
    courseId: "a",
    courseName: "La salud",
    progressPercentage: 0,
    accessExpiresAt: "2026-11-26T12:00:00",
  };
  const cafe = {
    courseId: "b",
    courseName: "En la cafetería",
    progressPercentage: 0,
    accessExpiresAt: null,
  };

  it("names the course and the soonest end", () => {
    expect(
      followUpProgressText(
        participant({
          courses: [salud],
          progressPercentage: 13,
          accessExpiresAt: "2026-11-24T12:00:00",
        }),
      ),
    ).toBe("13% completado de La salud · acceso hasta el 24 nov");
  });

  it("joins several courses and leaves the date out when none ends", () => {
    expect(followUpProgressText(participant({ courses: [cafe, salud, cafe] }))).toBe(
      "0% completado de En la cafetería, La salud y En la cafetería",
    );
  });
});

describe("followUpCourseDetail", () => {
  it("lists every course with its own progress and end", () => {
    expect(
      followUpCourseDetail(
        participant({
          courses: [
            {
              courseId: "b",
              courseName: "En la cafetería",
              progressPercentage: 20,
              accessExpiresAt: "2026-12-12T12:00:00",
            },
            { courseId: "a", courseName: "La salud", progressPercentage: 0, accessExpiresAt: null },
          ],
        }),
      ),
    ).toBe("En la cafetería: 20% · vence el 12 dic\nLa salud: 0%");
  });
});
