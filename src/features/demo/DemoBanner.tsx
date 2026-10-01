import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
export function DemoBanner() {
  return (
    <div className="demo-banner">
      <Sparkles size={18} />
      <p>
        <strong>Demo mode</strong>
        <span>
          This dashboard uses fictional sample data. Editing is disabled.
        </span>
      </p>
      <Link to="/sign-up">
        Create your own account <ArrowRight size={16} />
      </Link>
    </div>
  );
}
