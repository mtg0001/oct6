import { useState } from "react";

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  const handleNumber = (n: string) => {
    if (reset) {
      setDisplay(n);
      setReset(false);
    } else {
      setDisplay(display === "0" ? n : display + n);
    }
  };

  const handleOp = (o: string) => {
    setPrev(parseFloat(display));
    setOp(o);
    setReset(true);
  };

  const calculate = () => {
    if (prev === null || !op) return;
    const curr = parseFloat(display);
    let result = 0;
    switch (op) {
      case "+": result = prev + curr; break;
      case "-": result = prev - curr; break;
      case "×": result = prev * curr; break;
      case "÷": result = curr !== 0 ? prev / curr : 0; break;
      case "%": result = prev % curr; break;
    }
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setReset(true);
  };

  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); };
  const clearEntry = () => setDisplay("0");
  const toggleSign = () => setDisplay(String(parseFloat(display) * -1));
  const addDot = () => { if (!display.includes(".")) setDisplay(display + "."); };

  const Btn = ({ label, onClick, variant = "default" }: { label: string; onClick: () => void; variant?: "default" | "op" | "action" | "equals" }) => {
    const base = "h-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center";
    const styles = {
      default: "bg-card border border-border text-foreground hover:bg-muted",
      op: "bg-card border border-border text-accent hover:bg-muted",
      action: "bg-accent/15 text-accent border border-accent/20 hover:bg-accent/25",
      equals: "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25",
    };
    return <button className={`${base} ${styles[variant]}`} onClick={onClick}>{label}</button>;
  };

  return (
    <div className="bg-card rounded-xl p-3.5 shadow-sm border border-border hover:shadow-md transition-shadow">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Calculadora</p>
      <div className="bg-muted rounded-lg px-3 py-1.5 mb-2 text-right text-lg font-mono text-foreground">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1">
        <Btn label="AC" onClick={clear} variant="action" />
        <Btn label="C" onClick={clearEntry} variant="action" />
        <Btn label="⌫" onClick={() => setDisplay(display.length > 1 ? display.slice(0, -1) : "0")} variant="op" />
        <Btn label="%" onClick={() => handleOp("%")} variant="op" />
        {["7","8","9"].map(n => <Btn key={n} label={n} onClick={() => handleNumber(n)} />)}
        <Btn label="+" onClick={() => handleOp("+")} variant="op" />
        {["4","5","6"].map(n => <Btn key={n} label={n} onClick={() => handleNumber(n)} />)}
        <Btn label="×" onClick={() => handleOp("×")} variant="op" />
        {["1","2","3"].map(n => <Btn key={n} label={n} onClick={() => handleNumber(n)} />)}
        <Btn label="-" onClick={() => handleOp("-")} variant="op" />
        <Btn label="+/-" onClick={toggleSign} />
        <Btn label="0" onClick={() => handleNumber("0")} />
        <Btn label="." onClick={addDot} />
        <Btn label="÷" onClick={() => handleOp("÷")} variant="op" />
        <div className="col-span-4">
          <button
            onClick={calculate}
            className="w-full h-8 rounded-lg text-xs font-semibold bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 transition-colors"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
