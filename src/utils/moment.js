import moment from 'moment';

export const archiveTime = (day) => {
  if(day === null) return null;
  const archiveTime = moment().add(day, 'days').format('YYYY-MM-DD HH:mm');
  return archiveTime;
};