import { v4 as uuidv4 } from 'uuid';

export function generate_id(): string {
  return uuidv4();
}
