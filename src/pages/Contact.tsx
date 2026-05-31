import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setTicketId(data.ticketId);
        toast.success("Message sent! We'll respond within 24 hours.");
        setFormData({ name: '', email: '', subject: 'general', message: '' });
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.');
      }
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Get in touch</h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto">
            Questions about our products, pricing, or partnerships? We're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            {ticketId ? (
              <div className="bg-[#13151C] border border-green-500/30 rounded-xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Message received</h2>
                <p className="text-gray-400 mb-4">We'll respond within 24 hours.</p>
                <p className="text-sm text-gray-500">
                  Ticket reference: <span className="font-mono text-green-400">{ticketId}</span>
                </p>
                <button
                  onClick={() => setTicketId('')}
                  className="mt-6 px-6 py-2 border border-white/20 hover:border-white/40 text-white text-sm rounded-lg transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8 space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5A4BFF] transition-colors"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5A4BFF] transition-colors"
                      placeholder="jane@chambers.co.uk"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5A4BFF] transition-colors"
                  >
                    <option value="general">General Enquiry</option>
                    <option value="demo">Product Demo</option>
                    <option value="partnership">Partnership</option>
                    <option value="press">Press</option>
                    <option value="support">Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5A4BFF] transition-colors resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Contact information</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#5A4BFF] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <a
                      href="mailto:hello@ultai.group"
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      hello@ultai.group
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#5A4BFF] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <a
                      href="tel:+447825600471"
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      +44 7825 600471
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#5A4BFF] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm text-gray-300">England &amp; Wales (registered)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#5A4BFF] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Response time</p>
                    <p className="text-sm text-gray-300">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Looking for something specific?
              </h3>
              <div className="space-y-2">
                <a
                  href="/book-demo"
                  className="block text-sm text-gray-400 hover:text-white transition-colors py-1"
                >
                  Book a product demo &rarr;
                </a>
                <a
                  href="/audit"
                  className="block text-sm text-gray-400 hover:text-white transition-colors py-1"
                >
                  Start a free audit &rarr;
                </a>
                <a
                  href="/pricing"
                  className="block text-sm text-gray-400 hover:text-white transition-colors py-1"
                >
                  View pricing &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
