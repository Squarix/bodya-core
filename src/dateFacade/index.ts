export const TIME_MINUTE_S = 60;
export const TIME_MINUTE_MS = TIME_MINUTE_S * 1000;
export const TIME_HOUR_S = TIME_MINUTE_S * 60;
export const TIME_HOUR_MS = TIME_MINUTE_MS * 60;
export const TIME_DAY_S = TIME_HOUR_S * 24;
export const TIME_DAY_MS = TIME_HOUR_MS * 24;

let mockedDateTime: number | undefined;

export const mockDateTime = (timeMs?: number) => {
    mockedDateTime = timeMs;
};

export const getCurrentTimeMs = () => {
    if (mockedDateTime) {
        return mockedDateTime;
    }

    return Date.now();
};

export const diffFromNowMinutes = (date: Date, limitHours?: number): number => {
    const diffMilliseconds = getCurrentTimeMs() - date.getTime();
    let diffMinutes = diffMilliseconds / (1000 * 60);

    // Limit the difference by hours
    if (limitHours && diffMinutes > limitHours * 60) {
        diffMinutes = limitHours * 60;
    }

    return diffMinutes;
};
