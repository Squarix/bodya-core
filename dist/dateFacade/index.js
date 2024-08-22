"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffFromNowMinutes = exports.getCurrentTimeMs = exports.mockDateTime = exports.TIME_DAY_MS = exports.TIME_DAY_S = exports.TIME_HOUR_MS = exports.TIME_HOUR_S = exports.TIME_MINUTE_MS = exports.TIME_MINUTE_S = void 0;
exports.TIME_MINUTE_S = 60;
exports.TIME_MINUTE_MS = exports.TIME_MINUTE_S * 1000;
exports.TIME_HOUR_S = exports.TIME_MINUTE_S * 60;
exports.TIME_HOUR_MS = exports.TIME_MINUTE_MS * 60;
exports.TIME_DAY_S = exports.TIME_HOUR_S * 24;
exports.TIME_DAY_MS = exports.TIME_HOUR_MS * 24;
let mockedDateTime;
const mockDateTime = (timeMs) => {
    mockedDateTime = timeMs;
};
exports.mockDateTime = mockDateTime;
const getCurrentTimeMs = () => {
    if (mockedDateTime) {
        return mockedDateTime;
    }
    return Date.now();
};
exports.getCurrentTimeMs = getCurrentTimeMs;
const diffFromNowMinutes = (date, limitHours) => {
    const diffMilliseconds = (0, exports.getCurrentTimeMs)() - date.getTime();
    let diffMinutes = diffMilliseconds / (1000 * 60);
    // Limit the difference by hours
    if (limitHours && diffMinutes > limitHours * 60) {
        diffMinutes = limitHours * 60;
    }
    return diffMinutes;
};
exports.diffFromNowMinutes = diffFromNowMinutes;
