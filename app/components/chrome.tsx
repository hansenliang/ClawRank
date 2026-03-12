export function WindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <div className="window">
 <div className="window-bar">
 <div className="window-dots">
 <span />
 <span />
 <span />
 </div>
 <div>{title}</div>
 </div>
 {children}
 </div>
 );
}
