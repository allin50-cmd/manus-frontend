import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { API_BASE } from '../utils/constants';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Contact() {
  usePageTitle('Contact');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      toast.success('Message sent successfully!');
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const offices = [
    { city: 'London', address: '71-75 Shelton Street, Covent Garden, WC2H 9JQ', phone: '+44 20 7946 0958' },
    { city: 'Manchester', address: '123 Deansgate, Manchester, M3 2BQ', phone: '+44 161 456 7890' },
  ];

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4">Message Sent</h1>
          <p className="text-slate-400 mb-8">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A4BFF] text-white rounded-full font-bold hover:bg-[#6B5BFF] transition-colors">
            Back to Home <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 text-[#5A4BFF] text-sm font-medium mb-8">
            <MessageSquare className="w-4 h-4" /> Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            We'd love to <span className="text-[#5A4BFF]">hear from you</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Have a question about FineGuard? Need help choosing a plan? Want to become a partner? We're here to help.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="contact-name" className="text-slate-300 mb-1.5 block">Full Name</Label>
                      <Input id="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-slate-300 mb-1.5 block">Email</Label>
                      <Input id="contact-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.co.uk" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="contact-company" className="text-slate-300 mb-1.5 block">Company</Label>
                      <Input id="contact-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Ltd" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div>
                      <Label htmlFor="contact-subject" className="text-slate-300 mb-1.5 block">Subject</Label>
                      <Input id="contact-subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Compliance enquiry" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact-message" className="text-slate-300 mb-1.5 block">Message</Label>
                    <Textarea id="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us how we can help..." className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-3 rounded-full font-bold">
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Offices */}
              {offices.map((office) => (
                <div key={office.city} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{office.city} Office</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[#5A4BFF] mt-1 flex-shrink-0" />
                      <p className="text-sm text-slate-400">{office.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#5A4BFF] flex-shrink-0" />
                      <p className="text-sm text-slate-400">{office.phone}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick Info */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#5A4BFF] flex-shrink-0" />
                    <p className="text-sm text-slate-400">hello@fineguard.co.uk</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#5A4BFF] flex-shrink-0" />
                    <p className="text-sm text-slate-400">Mon-Fri 9am-6pm GMT</p>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 rounded-2xl p-6 text-center">
                <p className="text-sm text-[#5A4BFF] font-medium">Average response time</p>
                <p className="text-3xl font-black text-white mt-1">&lt; 4 hours</p>
                <p className="text-xs text-slate-400 mt-1">During business hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
