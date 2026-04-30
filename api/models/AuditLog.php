<?php

class AuditLog {
    public $id;
    public $user_id;
    public $action;
    public $entity_type;
    public $entity_id;
    public $old_values;
    public $new_values;
    public $ip_address;
    public $created_at;

    // Optional relation for returning to frontend
    public $username;

    public function toArray() {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'username' => $this->username,
            'action' => $this->action,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'old_values' => $this->old_values ? json_decode($this->old_values) : null,
            'new_values' => $this->new_values ? json_decode($this->new_values) : null,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at
        ];
    }
}
