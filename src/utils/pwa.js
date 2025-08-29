export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const sendNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    });
  }
};

// Trading Goals Component
const TradingGoals = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_amount: '',
    target_date: '',
    goal_type: 'profit'
  });

  const addGoal = async () => {
    try {
      await api.post('/api/goals', newGoal);
      setNewGoal({ title: '', target_amount: '', target_date: '', goal_type: 'profit' });
      // Refresh goals
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  return (
    <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50">
      <h2 className="text-xl font-semibold mb-4">Trading Goals</h2>
      
      {/* Add New Goal Form */}
      <div className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Goal title"
          value={newGoal.title}
          onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
          className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600"
        />
        <input
          type="number"
          placeholder="Target amount"
          value={newGoal.target_amount}
          onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
          className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600"
        />
        <input
          type="date"
          value={newGoal.target_date}
          onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
          className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600"
        />
        <button
          onClick={addGoal}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
        >
          Add Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal, index) => (
          <div key={index} className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{goal.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                goal.is_completed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {goal.is_completed ? 'Completed' : 'In Progress'}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Target: {formatCurrency(goal.target_amount)} • Due: {goal.target_date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
