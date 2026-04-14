import { CheckSquare, Bell, ShieldCheck } from 'lucide-react';

const steps = [
  { icon: CheckSquare, number: '1', title: 'Select Services', description: 'Choose your compliance needs.' },
  { icon: Bell, number: '2', title: 'Get Alerts', description: 'Receive timely reminders.' },
  { icon: ShieldCheck, number: '3', title: 'Stay Protected', description: 'Rest easy with active monitoring.' },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
      {steps.map(({ icon: Icon, number, title, description }) => (
        <div key={number} className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-600">{number}. {title}</p>
            <p className="text-sm text-slate-600 mt-0.5">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
