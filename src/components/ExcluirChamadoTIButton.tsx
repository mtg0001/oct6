import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { excluirChamadoTI } from "@/stores/chamadosTIStore";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  chamadoId: string;
  onDeleted?: () => void;
}

export function ExcluirChamadoTIButton({ chamadoId, onDeleted }: Props) {
  const currentUser = useCurrentUser();
  const [loading, setLoading] = useState(false);

  if (!currentUser?.podeExcluirChamado) return null;

  const handleExcluir = async () => {
    setLoading(true);
    try {
      await excluirChamadoTI(chamadoId, currentUser.nome);
      toast.success("Chamado TI movido para a lixeira");
      onDeleted?.();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir chamado TI">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir chamado TI?</AlertDialogTitle>
          <AlertDialogDescription>
            O chamado será movido para a lixeira e poderá ser restaurado em até 30 dias.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleExcluir} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
