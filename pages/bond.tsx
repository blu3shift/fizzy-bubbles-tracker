import { NextPage } from "next";
import {
  useDebouncedListSave,
  useRepositories,
  waitForTransactions,
} from "~/services";
import { BondLog, BondStylingConfig, Pokemon } from "~/orm/entities";
import { useListState } from "@mantine/hooks";
import { useAsyncEffect } from "use-async-effect";
import { Repository } from "typeorm";
import {
  Box,
  createStyles,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Title,
} from "@mantine/core";
import { EditModeToggle } from "~/components";
import { useCallback, useMemo, useState } from "react";
import { BondSummary } from "~/pageComponents/bond/BondSummary";
import { BondConfigEditor } from "~/pageComponents/bond/BondConfigEditor";
import { DataTableProps, PropConfig } from "~/components/dataTable/dataTable";
import {
  createNumberPropConfig,
  createSelectPropConfig,
} from "~/components/dataTable/configCreators";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { LogDataTable } from "~/components/dataTable/logDataTable";
import { BondBbCodeOutput } from "~/pageComponents/bond/BondBBCodeOutput";
dayjs.extend(utc);

const useDataTableStyles = createStyles({
  pokemon: {
    minWidth: "10em",
  },
  sourceUrl: {
    maxWidth: "15em",
  },
});

const BondPage: NextPage = () => {
  const [bondConfigRepo, bondRepo, pokemonRepo] = useRepositories(
    BondStylingConfig,
    BondLog,
    Pokemon
  ) as [
    Repository<BondStylingConfig>,
    Repository<BondLog>,
    Repository<Pokemon>
  ];

  const [bondLogs, bondLogsHandler] = useListState<BondLog>([]);
  const [bondConfigs, bondConfigsHandler] = useListState<BondStylingConfig>([]);
  const [pokemonList, pokemonListHandler] = useListState<
    Pick<Pokemon, "uuid" | "name" | "species">
  >([]);

  useAsyncEffect(async () => {
    if (!bondConfigRepo || !bondRepo || !pokemonRepo) return;
    await waitForTransactions(bondRepo);
    bondLogsHandler.setState(
      await bondRepo.find({ loadEagerRelations: false, loadRelationIds: true })
    );

    await waitForTransactions(pokemonRepo);
    const pkmList: typeof pokemonList = await pokemonRepo.find({
      select: ["uuid", "name", "species"],
      loadEagerRelations: false,
    });
    pokemonListHandler.setState(pkmList);

    await waitForTransactions(bondConfigRepo);
    const bndConfigs = await bondConfigRepo.find();
    const tempConfigs = pkmList
      .filter((p) => bndConfigs.every((b) => b.pokemonUuid !== p.uuid))
      .map((p) => bondConfigRepo.create({ pokemonUuid: p.uuid }));

    bondConfigsHandler.setState(bndConfigs.concat(tempConfigs));
  }, [bondConfigRepo, pokemonRepo]);

  const [editModeOn, setEditModeOn] = useState<boolean>(false);

  const saveBondConfig = useDebouncedListSave(bondConfigRepo);

  const onBondConfigEdit = useCallback(
    (
      config: BondStylingConfig,
      prop: keyof BondStylingConfig,
      value: BondStylingConfig[typeof prop]
    ) => {
      const index = bondConfigs.indexOf(config);
      bondConfigsHandler.setItemProp(index, prop, value);
      saveBondConfig(config, { [prop]: value });
    },
    [saveBondConfig, bondConfigs]
  );

  const dataTablePropConfig: PropConfig<BondLog> = useMemo(
    () => ({
      value: createNumberPropConfig("value", "Change", 0),
      pokemon: createSelectPropConfig(
        pokemonList.map((pkm) => ({
          value: pkm.uuid,
          label: `${pkm.name || "(Unnamed)"} the ${
            pkm.species || "(Unknown Pokemon)"
          }`,
        })),
        "pokemon",
        "Pokemon",
        1
      ),
    }),
    [pokemonList]
  );

  const saveBondLog = useDebouncedListSave(bondRepo);

  const dataTableConfig: Omit<DataTableProps<BondLog>, "rowObjs"> = useMemo(
    () => ({
      rowObjToId: (log) => log.pokemon as any,
      propConfig: dataTablePropConfig,
      add: async () => {
        bondLogsHandler.append(
          await bondRepo.save(
            bondRepo.create({
              value: 0,
              pokemon: pokemonList[0].uuid as any,
              date: dayjs().utc(),
            })
          )
        );
      },
      edit: async (log, prop, value) => {
        const index = bondLogs.indexOf(log);
        bondLogsHandler.setItemProp(index, prop, value);
        saveBondLog(log, { [prop]: value });
      },
      remove: async (log) => {
        bondLogsHandler.filter((l) => l.id !== log.id);
        await bondRepo.remove(log);
      },
    }),
    [bondLogs, bondRepo, dataTablePropConfig, pokemonList, saveBondLog]
  );

  const dataTableStyles = useDataTableStyles();

  if (!bondConfigRepo || !bondRepo || !pokemonRepo) return <>Loading...</>;

  return (
    <>
      <Stack>
        <Group
          sx={{
            alignContent: "center",
          }}
        >
          <Title
            order={2}
            sx={{
              width: "50%",
              textAlign: "right",
              marginRight: "auto",
            }}
          >
            Bond
          </Title>
          <EditModeToggle checked={editModeOn} onToggle={setEditModeOn} />
        </Group>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "20em 1fr",
          }}
        >
          <Title order={3} mb={"0.5em"}>
            Summary
          </Title>
          <Title order={3} mb={"0.5em"}>
            Bond Styling
          </Title>
          <BondSummary
            bondLogs={bondLogs}
            bondConfigs={bondConfigs}
            pokemonList={pokemonList}
          />
          <ScrollArea
            type={"auto"}
            sx={(theme) => ({ backgroundColor: theme.colors.dark[8] })}
          >
            <BondConfigEditor
              bondConfigs={bondConfigs}
              onChange={onBondConfigEdit}
            />
          </ScrollArea>
        </Box>
        <Title order={3}>Detail</Title>
        <Paper
          sx={(theme) => ({
            margin: "0.5em",
            borderRadius: "0.5em",
            border: "1px solid " + theme.colors.gray[7],
            backgroundColor: theme.fn.darken(theme.colors.gray[9], 0.2),
            overflow: "clip",
          })}
        >
          <ScrollArea.Autosize maxHeight="40vh">
            <LogDataTable
              rowObjs={bondLogs}
              isShopLog={true}
              isEditMode={editModeOn}
              propsToMantineClasses={dataTableStyles.classes}
              {...dataTableConfig}
            />
          </ScrollArea.Autosize>
        </Paper>
        <Title order={3}>Output</Title>
        <BondBbCodeOutput
          bondLogs={bondLogs}
          bondConfigs={bondConfigs}
          pokemonList={pokemonList}
        />
      </Stack>
    </>
  );
};

export default BondPage;
