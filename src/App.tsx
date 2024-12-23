import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredMentions, setFilteredMentions] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoCompleteRef = useRef<HTMLDivElement>(null);

  const mentionSuggestions = ["french", "friday", "frog & fries"];

  // Handles input in the contenteditable div
  const handleInput = () => {
    if (!contentRef.current) return;

    let textContent = contentRef.current.innerText;

    // Ensure the text does not exceed 200 characters
    if (textContent.length > 200) {
      textContent = textContent.slice(0, 200);
      contentRef.current.innerText = textContent; // Update the contentEditable div with the truncated text
    }

    const cursorPosition = getCursorPosition(contentRef.current);

    // Trigger autocomplete for mentions
    const lastWord = textContent.split(" ").pop();
    if (lastWord && lastWord.startsWith("@")) {
      const query = lastWord.substring(1).toLowerCase();
      if (query) {
        const matches = mentionSuggestions.filter((mention) =>
          mention.toLowerCase().startsWith(query)
        );
        setFilteredMentions(matches);
        setShowAutocomplete(true);
      }
    } else {
      setShowAutocomplete(false);
    }

    const highlighted = highlightText(textContent);
    contentRef.current.innerHTML = highlighted;
    setCursorPosition(contentRef.current, cursorPosition);
  };

  // Handles selecting a mention from the autocomplete suggestions
  const handleSelectMention = (mention: string) => {
    const textContent = contentRef.current!.innerText;
    const words = textContent.split(" ");
    words.pop(); // Remove the current mention being typed
    const newText = `${words.join(" ")} @${mention} `;

    setShowAutocomplete(false);
    if (contentRef.current) {
      contentRef.current.innerHTML = highlightText(newText);
    }
  };

  // Get the current cursor position in the contenteditable div
  const getCursorPosition = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  // Set the cursor position back to its original location after modifying the content
  const setCursorPosition = (element: HTMLElement, position: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const range: any = window.getSelection()?.getRangeAt(0);
    const sel = window.getSelection();
    let currentLength = 0;
    const nodeStack = [element];
    let node;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nodeLength = node.nodeValue?.length || 0;
        if (currentLength + nodeLength >= position) {
          range.setStart(node, position - currentLength);
          range.setEnd(node, position - currentLength);
          foundStart = true;
        } else {
          currentLength += nodeLength;
        }
      } else if (node instanceof HTMLElement) {
        const children = Array.from(node.childNodes);
        // @ts-expect-error to disable the error for the next line
        nodeStack.push(...children.reverse());
      }
    }

    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    if (
      !contentRef.current ||
      !showAutocomplete ||
      filteredMentions.length === 0
    )
      return;

    if (!range) return;

    // Get the position of the cursor using getBoundingClientRect
    const rect = range.getBoundingClientRect();
    console.log(autoCompleteRef);
    if (autoCompleteRef?.current) {
      const { current } = autoCompleteRef;
      const { bottom, left } = rect;

      current.style.position = "absolute";
      current.style.top = `${bottom + window.scrollY + 5}px`; // Position it just below the cursor
      current.style.left = `${left + window.scrollX}px`; // Align it with the cursor's left position
    }
  };

  // Highlights text (mentions, hashtags, URLs) with specific styles
  const highlightText = (text: string) => {
    const urlPattern =
      /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const hashtagPattern = /#[^\s]+/g;
    const atPattern = /@[^\s]+/g;

    return text
      .replace(
        urlPattern,
        '<span class="text-indigo-600  text-lg font-semibold">$&</span>'
      )
      .replace(
        hashtagPattern,
        '<span class="text-indigo-600  text-lg font-semibold">$&</span>'
      )
      .replace(
        atPattern,
        '<span class="bg-gray-100 rounded-lg p-1 font-extrabold text-gray-800 text-lg ">$&</span>'
      );
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-2xl p-6 mt-5">
        <div
          ref={contentRef}
          className="w-full border-0 focus:outline-0 h-28 text-lg text-gray-800 placeholder:text-gray-500 relative"
          contentEditable
          onInput={handleInput}
          suppressContentEditableWarning
          data-placeholder="write something..."
        />
      </div>
      {showAutocomplete && (
        <div
          className="autocomplete rounded-lg border-gray-100 shadow-lg"
          ref={autoCompleteRef}
        >
          {filteredMentions.map((mention, index) => (
            <div
              key={index}
              className="autocomplete-item hover:bg-gray-100 p-2 rounded-md"
              onClick={() => handleSelectMention(mention)}
            >
              {mention}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
