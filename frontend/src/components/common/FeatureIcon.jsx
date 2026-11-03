
import {
    CodeXml,
    BrainCircuit,
    FileClock,
} from "lucide-react";

function FeatureIcon({ type }) {
    const icons = {
        analysis: CodeXml,
        recommend: BrainCircuit,
        history: FileClock,
    };

    const IconComponent = icons[type];

    if (!IconComponent) return null;

    return (
        <IconComponent
            size={25}
            strokeWidth={1.8}
            aria-hidden="true"
        />
    );
}

export default FeatureIcon;
