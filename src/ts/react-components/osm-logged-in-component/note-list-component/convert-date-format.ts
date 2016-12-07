export default function (originalDate: Date): string {
  'use strict';
  const nowUNIXtime = Math.floor(Date.now() / 1000);
  const originalDateUNIXtime = Math.floor(originalDate.getTime() / 1000);
  const diff = nowUNIXtime - originalDateUNIXtime;
  if (diff < 60) {
    return `${diff}s`;
  }
  else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m`;
  }
  else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h`;
  }
  else {
    return `${originalDate.toLocaleDateString()}`;
  }
}