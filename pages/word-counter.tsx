import { SimpleGrid, Stack, Textarea, Title } from "@mantine/core";
import { NextPage } from "next";
import { BBCodeArea } from "~/components";
import { useDataSource } from "~/services";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAsyncEffect } from "use-async-effect";
import { MiscValue } from "~/orm/entities/miscValue";
import { debounce } from "~/util";
import { Repository } from "typeorm";

const WordCounterPage: NextPage = () => {
  const ds = useDataSource();
  const [repo, setRepo] = useState<Repository<MiscValue>>();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState<string>();

  useEffect(() => {
    if (ds) {
      setRepo(ds.getRepository(MiscValue));
    }
  }, [ds]);

  useAsyncEffect(async () => {
    if (!repo || !textAreaRef.current) return;

    const dbValue = await repo.findOneBy({ key: "word counter" });
    textAreaRef.current.value = dbValue?.value ?? "";
    setText(textAreaRef.current.value);
  }, [repo, textAreaRef.current]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onTextChange = useCallback(
    debounce((newText: string) => {
      setText(newText);

      if (!repo) return;
      repo.save({ key: "word counter", value: newText }).then();
    }, 250),
    [repo]
  );

  return (
    <Stack>
      <Title>Word Counter</Title>
      <SimpleGrid
        cols={1}
        spacing="lg"
        breakpoints={[{ minWidth: "md", cols: 2 }]}
        sx={{
          "& > *": {
            minHeight: "20em",
          },
        }}
      >
        <Textarea
          ref={textAreaRef}
          styles={{
            input: {
              resize: "vertical",
            },
          }}
          autosize
          minRows={15}
          maxRows={30}
          onChange={(event) => {
            onTextChange(event.currentTarget.value);
          }}
        />
        <BBCodeArea
          label={
            "~" +
            (text
              ?.replaceAll(/\[quote\S+].*\[\/quote]/gis, "")
              .split(/\s/gm)
              .filter((w) => w.length !== 0).length ?? 0) +
            " Words"
          }
          bbCode={text ?? ""}
          stickyLabel={true}
        />
      </SimpleGrid>
    </Stack>
  );
};

export default WordCounterPage;
