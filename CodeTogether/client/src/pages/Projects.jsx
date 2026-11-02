import { FiFolderPlus } from 'react-icons/fi';

export default function Projects() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <FiFolderPlus size={48} style={{ color: 'var(--text-muted)' }} />
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Projects</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Your projects will appear here. Coming soon!</p>
    </div>
  );
}
