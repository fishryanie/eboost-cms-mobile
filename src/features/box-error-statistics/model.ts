export type BoxErrorRecord = {
  vehicle: TechnicalVehicle;
  box_id: number;
  box_name: string | null;
  vendor_id: string | null;
  unique_id: string | null;
  station_id: number | null;
  station_name: string | null;
  total_sessions: number;
  failed_sessions: number;
  error_rate_percent: number;
};

export type BoxErrorStatistics = {
  start_time: number;
  end_time: number;
  error_threshold: number;
  total_items: number;
  boxes: BoxErrorRecord[];
};

export type BoxErrorFilter = 'all' | TechnicalVehicle;

export function filterBoxErrors(boxes: BoxErrorRecord[], filter: BoxErrorFilter, search: string) {
  const term = search.trim().toLocaleLowerCase();
  return boxes
    .filter(box => {
      if (filter !== 'all' && box.vehicle !== filter) return false;
      return (
        !term ||
        `${box.box_id} ${box.box_name || ''} ${box.vendor_id || ''} ${box.unique_id || ''} ${box.station_id ?? ''} ${box.station_name || ''}`
          .toLocaleLowerCase()
          .includes(term)
      );
    })
    .sort((a, b) => b.error_rate_percent - a.error_rate_percent || b.failed_sessions - a.failed_sessions);
}
