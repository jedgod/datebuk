'use client';

import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { apiEndpoint } from '@/lib/config';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueType: 'general',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch(apiEndpoint('/support/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }

      setSuccess('Your message has been sent! Our team will respond within 24 hours.');
      setFormData({ name: '', email: '', issueType: 'general', message: '' });
    } catch (err) {
      setError('Error submitting ticket. Please try again or email support@datebuk.com');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            DateBuk
          </a>
          <a href="/" className="text-sm font-semibold text-gray-700 hover:text-black">
            ← Back Home
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600">
            We're here to help. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Email - Clickable */}
          <a
            href="mailto:support@datebuk.com"
            className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer group"
          >
            <Mail className="h-8 w-8 text-pink-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-pink-600 font-semibold text-sm group-hover:underline">support@datebuk.com</p>
            <p className="text-gray-500 text-xs mt-2">Click to send email</p>
          </a>

          {/* Response Time - Info Only */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <Phone className="h-8 w-8 text-indigo-500 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Response Time</h3>
            <p className="text-gray-600 text-sm">Usually within 24 hours</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                aria-label="Issue Type"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="general">General Inquiry</option>
                <option value="account">Account Issue</option>
                <option value="payment">Payment/Billing</option>
                <option value="safety">Safety Concern</option>
                <option value="technical">Technical Problem</option>
                <option value="feedback">Feedback/Suggestion</option>
                <option value="report">Report User/Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Tell us how we can help..."
              />
            </div>

            {success && (
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <p className="text-green-800 font-semibold">{success}</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-red-800 font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg font-semibold py-3 px-4 text-white transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              We respect your privacy. Your information is confidential and will only be used to respond to your inquiry.
            </p>
          </form>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="font-bold text-gray-900 mb-3">FAQ</h3>
            <p className="text-gray-600 text-sm mb-4">
              Have a quick question? Check out our frequently asked questions.
            </p>
            <a href="#" className="text-pink-500 font-semibold hover:text-pink-600">
              View FAQ →
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="font-bold text-gray-900 mb-3">Community Guidelines</h3>
            <p className="text-gray-600 text-sm mb-4">
              Learn more about how to use DateBuk safely and responsibly.
            </p>
            <a href="/terms" className="text-pink-500 font-semibold hover:text-pink-600">
              Read Guidelines →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
