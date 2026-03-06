import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginMode = 'password' | 'magic_link';

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState<LoginMode>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'partner@fineguard.co.uk',
      password: 'demo',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'magic_link') {
        // Simulate magic link
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMagicLinkSent(true);
      } else {
        await login(data.email, data.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a magic link to <strong>{getValues('email')}</strong>.
            Click the link to sign in securely.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white">FineGuard</div>
              <div className="text-sm text-blue-300">MTD Control Centre</div>
            </div>
          </div>
          <p className="mt-4 text-gray-400 text-sm">
            UK compliance platform for accountants and SME directors
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Sign in to your account</h1>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={cn(
                'flex-1 py-1.5 text-sm font-medium rounded-md transition-all',
                mode === 'password'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode('magic_link')}
              className={cn(
                'flex-1 py-1.5 text-sm font-medium rounded-md transition-all',
                mode === 'magic_link'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Magic Link
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={cn('input pl-9', errors.email && 'border-red-400')}
                  placeholder="you@company.co.uk"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            {mode === 'password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label !mb-0">Password</label>
                  <button type="button" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn('input pl-9 pr-10', errors.password && 'border-red-400')}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'magic_link' ? 'Send Magic Link' : 'Sign in'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-700 mb-2">Demo credentials:</p>
            <div className="space-y-1 text-xs text-blue-600">
              <div>Partner: partner@fineguard.co.uk / any password</div>
              <div>Accountant: accountant@fineguard.co.uk / any password</div>
              <div>Demo: demo@fineguard.co.uk / any password</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          FineGuard is HMRC-recognised software for Making Tax Digital.
          <br />
          All financial data is encrypted in transit and at rest.
        </p>
      </div>
    </div>
  );
}
