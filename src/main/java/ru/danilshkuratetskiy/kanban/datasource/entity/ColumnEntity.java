package ru.danilshkuratetskiy.kanban.datasource.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "columns")
public class ColumnEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "board_id", nullable = false)
    private UUID boardId;

    @Column(name = "order_index")
    private Integer order;
}
