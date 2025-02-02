import { Column, CreateDateColumn, Entity, ManyToOne } from "typeorm";
import { ItemDefinition } from "./itemDefinition";
import { ChangeLogBase } from "./changeLogBase";
import { UTCTransformer } from "~/orm/ormUtil";
import { Dayjs } from "dayjs";

@Entity({
  orderBy: {
    date: "ASC",
  },
})
export class ItemLog extends ChangeLogBase {
  @Column("integer", { default: 0 })
  quantityChange: number;

  @Column("integer", { nullable: true })
  itemDefinitionId: number | null;

  @ManyToOne(() => ItemDefinition, (def) => def.itemLogs, {
    nullable: true,
    orphanedRowAction: "delete",
  })
  itemDefinition: ItemDefinition | null;

  @CreateDateColumn({
    type: "integer",
    transformer: UTCTransformer,
  })
  date: Dayjs;
}
