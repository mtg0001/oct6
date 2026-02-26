export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      andamentos: {
        Row: {
          anexos: string[]
          created_at: string
          id: string
          solicitacao_id: string
          texto: string
        }
        Insert: {
          anexos?: string[]
          created_at?: string
          id?: string
          solicitacao_id: string
          texto: string
        }
        Update: {
          anexos?: string[]
          created_at?: string
          id?: string
          solicitacao_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "andamentos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          message_type: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes: {
        Row: {
          caracteristicas: Json
          cargo: string
          conhecimentos: string
          created_at: string
          departamento: string
          departamento_destino: string
          diretor_area: string
          evento: string
          excluido: boolean
          excluido_em: string | null
          excluido_por: string
          experiencia: string
          faixa_salarial_ate: string
          faixa_salarial_de: string
          formacao: string
          horario_ate: string
          horario_de: string
          id: string
          justificativa: string
          nome_substituido: string
          observacoes: string
          prioridade: string
          solicitante: string
          solicitante_id: string | null
          status: string
          tipo: string
          tipo_contrato: string
          tipo_vaga: string
          unidade: string
          unidade_destino: string
          updated_at: string
        }
        Insert: {
          caracteristicas?: Json
          cargo?: string
          conhecimentos?: string
          created_at?: string
          departamento?: string
          departamento_destino?: string
          diretor_area?: string
          evento?: string
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string
          experiencia?: string
          faixa_salarial_ate?: string
          faixa_salarial_de?: string
          formacao?: string
          horario_ate?: string
          horario_de?: string
          id?: string
          justificativa?: string
          nome_substituido?: string
          observacoes?: string
          prioridade?: string
          solicitante?: string
          solicitante_id?: string | null
          status?: string
          tipo: string
          tipo_contrato?: string
          tipo_vaga?: string
          unidade: string
          unidade_destino?: string
          updated_at?: string
        }
        Update: {
          caracteristicas?: Json
          cargo?: string
          conhecimentos?: string
          created_at?: string
          departamento?: string
          departamento_destino?: string
          diretor_area?: string
          evento?: string
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string
          experiencia?: string
          faixa_salarial_ate?: string
          faixa_salarial_de?: string
          formacao?: string
          horario_ate?: string
          horario_de?: string
          id?: string
          justificativa?: string
          nome_substituido?: string
          observacoes?: string
          prioridade?: string
          solicitante?: string
          solicitante_id?: string | null
          status?: string
          tipo?: string
          tipo_contrato?: string
          tipo_vaga?: string
          unidade?: string
          unidade_destino?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          id: string
          last_seen: string
          status: string
          usuario_id: string
        }
        Insert: {
          id?: string
          last_seen?: string
          status?: string
          usuario_id: string
        }
        Update: {
          id?: string
          last_seen?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          administrador: boolean
          ativo: boolean
          avatar_url: string | null
          created_at: string
          departamento: string
          diretoria: string[]
          email: string
          id: string
          must_change_password: boolean
          nome: string
          nova_solicitacao_unidades: string[]
          pode_excluir_chamado: boolean
          pode_ver_lixeira: boolean
          resolve_expedicao_go: boolean
          resolve_expedicao_sp: boolean
          resolve_logistica_compras_go: boolean
          resolve_logistica_compras_sp: boolean
          resolve_recursos_humanos_go: boolean
          resolve_recursos_humanos_sp: boolean
          servicos_permitidos: string[]
          unidade_padrao: string
          updated_at: string
          user_id: string | null
          visualiza_solicitacoes_unidades: string[]
        }
        Insert: {
          administrador?: boolean
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          departamento: string
          diretoria?: string[]
          email: string
          id?: string
          must_change_password?: boolean
          nome: string
          nova_solicitacao_unidades?: string[]
          pode_excluir_chamado?: boolean
          pode_ver_lixeira?: boolean
          resolve_expedicao_go?: boolean
          resolve_expedicao_sp?: boolean
          resolve_logistica_compras_go?: boolean
          resolve_logistica_compras_sp?: boolean
          resolve_recursos_humanos_go?: boolean
          resolve_recursos_humanos_sp?: boolean
          servicos_permitidos?: string[]
          unidade_padrao?: string
          updated_at?: string
          user_id?: string | null
          visualiza_solicitacoes_unidades?: string[]
        }
        Update: {
          administrador?: boolean
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          departamento?: string
          diretoria?: string[]
          email?: string
          id?: string
          must_change_password?: boolean
          nome?: string
          nova_solicitacao_unidades?: string[]
          pode_excluir_chamado?: boolean
          pode_ver_lixeira?: boolean
          resolve_expedicao_go?: boolean
          resolve_expedicao_sp?: boolean
          resolve_logistica_compras_go?: boolean
          resolve_logistica_compras_sp?: boolean
          resolve_recursos_humanos_go?: boolean
          resolve_recursos_humanos_sp?: boolean
          servicos_permitidos?: string[]
          unidade_padrao?: string
          updated_at?: string
          user_id?: string | null
          visualiza_solicitacoes_unidades?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_usuario_id_for_auth_user: {
        Args: { _auth_uid: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _auth_uid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
