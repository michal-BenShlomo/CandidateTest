/**
 * The exercise backend has no real login - it trusts X-User-Id/X-Is-Admin
 * headers as-is. This switcher lets the UI simulate different users so the
 * server-side permission enforcement (owner/assignee vs administrator) can
 * be demonstrated without building a full auth system.
 */
const DEMO_USERS = [
  { userId: 1, isAdmin: false, label: 'User #1 (regular)' },
  { userId: 2, isAdmin: false, label: 'User #2 (regular)' },
  { userId: 1, isAdmin: true, label: 'Administrator' },
];

export function UserSwitcher({ currentUser, onChange }) {
  const currentIndex = DEMO_USERS.findIndex(
    (u) => u.userId === currentUser.userId && u.isAdmin === currentUser.isAdmin,
  );

  return (
    <div className="user-switcher">
      <label htmlFor="demoUser">Viewing as</label>
      <select
        id="demoUser"
        value={currentIndex}
        onChange={(e) => onChange(DEMO_USERS[Number(e.target.value)])}
      >
        {DEMO_USERS.map((user, index) => (
          <option key={index} value={index}>{user.label}</option>
        ))}
      </select>
    </div>
  );
}
