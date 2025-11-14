-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unread_by_student INTEGER DEFAULT 0,
  unread_by_admin INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_conversations_student ON conversations(student_id);
CREATE INDEX idx_conversations_admin ON conversations(admin_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Students can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (
    auth.uid() = student_id OR 
    (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id)
  );

-- RLS Policies for messages
CREATE POLICY "Users can view conversation messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (student_id = auth.uid() OR admin_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (student_id = auth.uid() OR admin_id = auth.uid())
    )
  );

CREATE POLICY "Users can update message status"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (student_id = auth.uid() OR admin_id = auth.uid())
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Create trigger for updated timestamp
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();