export const TIME_MINUTE_S = 60;
export const TIME_MINUTE_MS = TIME_MINUTE_S * 1000;
export const TIME_HOUR_S = TIME_MINUTE_S * 60;
export const TIME_HOUR_MS = TIME_MINUTE_MS * 60;
export const TIME_DAY_S = TIME_HOUR_S * 24;
export const TIME_DAY_MS = TIME_HOUR_MS * 24;

export const diffFromNowMinutes = (date: Date, limitHours?: number): number => {
    // Разница во времени в миллисекундах
    const diffMilliseconds = Date.now() - date.getTime();

    // Переводим разницу в минуты
    let diffMinutes = diffMilliseconds / (1000 * 60);

    // Ограничиваем разницу по лимиту
    if (limitHours && diffMinutes > limitHours * 60) {
        diffMinutes = limitHours * 60;
    }

    return diffMinutes;
};

let mockedDateTime: Date;

export const mockDateTime = (timeMs: Date) => {
    mockedDateTime = timeMs;
};

export const getCurrentTimeMs = () => {
    if (mockedDateTime) {
        return mockedDateTime;
    }

    return Date.now();
};
