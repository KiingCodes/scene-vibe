import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BROADCAST_CHANNELS } from '@/lib/venueCommand';

export const BroadcastChannelSelect = ({ value, onChange, disabled }: {
  value: string; onChange: (value: string) => void; disabled?: boolean;
}) => (
  <div className="mb-3 space-y-1.5">
    <Label>Broadcast channel</Label>
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label="Broadcast channel"><SelectValue /></SelectTrigger>
      <SelectContent>
        {BROADCAST_CHANNELS.map(({ id, label }) => <SelectItem key={id} value={id}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);
