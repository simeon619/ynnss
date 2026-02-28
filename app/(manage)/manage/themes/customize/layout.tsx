export default function ThemeCustomizeLayout({ children }: { children: React.ReactNode }) {
	return <div className="fixed inset-0 z-50 bg-white overflow-hidden">{children}</div>;
}
