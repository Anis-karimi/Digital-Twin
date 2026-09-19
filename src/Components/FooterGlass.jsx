import "../styles/Allpages.css"

export const FooterGlass = ({ children }) => (
  <footer className="fixed bottom-0 left-0 w-full h-[70px] z-50">
    {/* Glass layer */}
    <div className="absolute inset-0 bg-neutral-scale1500/40 backdrop-blur-[1px]" />

    {/* Navigation */}
    <div className="relative z-10 h-full w-full flex justify-center items-start">
      {children}
    </div>
  </footer>
);
