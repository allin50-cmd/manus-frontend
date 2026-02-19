export default function CrmAdmin() {
  return (
    <div className="fixed inset-0 z-[60]">
      <iframe
        src="/crm.html"
        title="FineGuard CRM Admin"
        className="w-full h-full border-0"
        style={{ colorScheme: 'dark' }}
      />
    </div>
  );
}
