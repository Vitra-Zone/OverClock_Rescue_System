export function TouristHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="text-4xl font-bold text-orange-500 mb-2">🚨</div>
          <h1 className="text-2xl font-bold text-white mb-2">OverClock Rescue</h1>
          <p className="text-slate-400">Emergency assistance for tourists</p>
        </div>
        
        <div className="space-y-4">
          <a 
            href="/login" 
            className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
          >
            Login to Account
          </a>
          
          <a 
            href="/guest" 
            className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
          >
            Continue as Guest
          </a>
          
          <a 
            href="/register" 
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
          >
            Create Account
          </a>
        </div>
        
        <div className="mt-8 p-4 bg-slate-800 rounded-lg">
          <h3 className="font-semibold text-white mb-2">Emergency SOS</h3>
          <p className="text-sm text-slate-300 mb-3">Need immediate help? Stay on this app to alert emergency services of your location.</p>
          <a 
            href="/sos" 
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-center transition"
          >
            🆘 EMERGENCY SOS
          </a>
        </div>
      </div>
    </div>
  )
}
