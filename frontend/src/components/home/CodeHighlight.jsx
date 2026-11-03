
const TOKEN_PATTERN =
    /(\bdef\b|\bfor\b|\bin\b|\bif\b|\breturn\b|\b\d+\b)/g;

const KEYWORD_PATTERN = /^(def|for|in|if|return)$/;
const NUMBER_PATTERN = /^\d+$/;

function CodeHighlight({ text }) {
    const parts = text.split(TOKEN_PATTERN);

    return (
        <>
            {parts.map((part, index) => {
                if (KEYWORD_PATTERN.test(part)) {
                    return (
                        <span key={index} className="tk-key">
                            {part}
                        </span>
                    );
                }

                if (NUMBER_PATTERN.test(part)) {
                    return (
                        <span key={index} className="tk-num">
                            {part}
                        </span>
                    );
                }

                return part;
            })}
        </>
    );
}

export default CodeHighlight;
