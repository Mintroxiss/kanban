package ru.danilshkuratetskiy.kanban.datasource.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(
        name = "columns",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"board_id", "order_index"})
        }
)
public class ColumnEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "board_id", nullable = false)
    private UUID boardId;

    @Column(name = "order_index")
    private Integer order;
}
