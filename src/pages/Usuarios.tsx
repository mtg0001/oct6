import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useUsuarios } from "@/hooks/useUsuarios";
import { toggleUsuarioAtivo, type Usuario } from "@/stores/usuariosStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UsuarioFormDialog from "@/components/forms/UsuarioFormDialog";

const Usuarios = () => {
  const usuarios = useUsuarios();
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);

  // Filters
  const [fNome, setFNome] = useState("");
  const [fLogin, setFLogin] = useState("");
  const [fDep, setFDep] = useState("");
  const [fUnidade, setFUnidade] = useState("");

  const filtered = usuarios.filter((u) => {
    if (fNome && !u.nome.toLowerCase().includes(fNome.toLowerCase())) return false;
    if (fLogin && !u.login.toLowerCase().includes(fLogin.toLowerCase())) return false;
    if (fDep && !u.departamento.toLowerCase().includes(fDep.toLowerCase())) return false;
    if (fUnidade && !u.unidadePadrao.toLowerCase().includes(fUnidade.toLowerCase())) return false;
    return true;
  });

  const clearFilters = () => {
    setFNome("");
    setFLogin("");
    setFDep("");
    setFUnidade("");
  };

  const handleEdit = (u: Usuario) => {
    setEditUser(u);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  return (
    <AppLayout>
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-foreground">Usuários do Sistema</h1>
          <Button onClick={handleAdd}>Adicionar Novo Usuário</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Usuário (Login)</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">Limpar</button>
              </TableHead>
              <TableHead><Input placeholder="Filtrar nome..." value={fNome} onChange={(e) => setFNome(e.target.value)} className="h-7 text-xs" /></TableHead>
              <TableHead><Input placeholder="Filtrar login..." value={fLogin} onChange={(e) => setFLogin(e.target.value)} className="h-7 text-xs" /></TableHead>
              <TableHead><Input placeholder="Filtrar departamento..." value={fDep} onChange={(e) => setFDep(e.target.value)} className="h-7 text-xs" /></TableHead>
              <TableHead><Input placeholder="Filtrar unidade..." value={fUnidade} onChange={(e) => setFUnidade(e.target.value)} className="h-7 text-xs" /></TableHead>
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u, i) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>{u.nome}</TableCell>
                <TableCell>{u.login}</TableCell>
                <TableCell>{u.departamento}</TableCell>
                <TableCell>{u.unidadePadrao}</TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? "default" : "destructive"} className={u.ativo ? "bg-success text-success-foreground" : ""}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(u)}>Editar</Button>
                  <Button
                    variant={u.ativo ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => toggleUsuarioAtivo(u.id).catch(console.error)}
                  >
                    {u.ativo ? "Desativar" : "Reativar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UsuarioFormDialog open={formOpen} onOpenChange={setFormOpen} usuario={editUser} />
    </AppLayout>
  );
};

export default Usuarios;
