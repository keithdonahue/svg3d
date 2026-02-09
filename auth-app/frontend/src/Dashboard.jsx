export default function Dashboard({ user, onLogout }) {
  return (
    <div className="card dashboard">
      <div className="welcome">
        <h1>Welcome</h1>
        <p className="email">{user?.email}</p>
      </div>
      <p className="subtitle">You're logged in. Your session is stored in a cookie.</p>
      <button type="button" className="btn btn-secondary" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}
