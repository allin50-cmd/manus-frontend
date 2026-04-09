import { listAll } from '../repositories/monitoredCompanies.repo';

export async function getAllMonitoredCompanies() {
  return listAll();
}
