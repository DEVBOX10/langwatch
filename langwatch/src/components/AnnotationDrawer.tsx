import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  HStack,
  Input,
  Radio,
  RadioGroup,
  Spacer,
  Spinner,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast,
  Divider,
} from "@chakra-ui/react";

import { ExternalLink, ThumbsDown, ThumbsUp, Trash } from "react-feather";
import { useDrawer } from "~/components/CurrentDrawer";
import { MetadataTag } from "~/components/MetadataTag";
import { SmallLabel } from "~/components/SmallLabel";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useOrganizationTeamProject } from "~/hooks/useOrganizationTeamProject";
import { api } from "~/utils/api";
import { HorizontalFormControl } from "./HorizontalFormControl";
import Link from "next/link";
import {
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
} from "react-hook-form";

type Annotation = {
  isThumbsUp?: string | null;
  comment?: string | null;
  scoreOptions?: Record<string, { value: string; reason: string }>;
};

export function AnnotationDrawer({
  traceId,
  action,
  annotationId,
}: {
  traceId: string;
  action: "new" | "edit";
  annotationId?: string;
}) {
  const { project, isPublicRoute } = useOrganizationTeamProject();
  const { onClose } = useDisclosure();
  const { closeDrawer, openDrawer } = useDrawer();

  const router = useRouter();

  const listTableView = router.query.view;

  const toast = useToast();

  const createAnnotation = api.annotation.create.useMutation();
  const deleteAnnotation = api.annotation.deleteById.useMutation();

  const getAnnotationScoring = api.annotationScore.getAllActive.useQuery(
    {
      projectId: project?.id ?? "",
    },
    {
      enabled: !!project?.id && !isPublicRoute,
    }
  );

  const getAnnotation = api.annotation.getById.useQuery({
    projectId: project?.id ?? "",
    annotationId: annotationId ?? "",
  });

  const updateAnnotation = api.annotation.updateByTraceId.useMutation();

  const { isThumbsUp, comment, id, scoreOptions } = getAnnotation.data ?? {
    isThumbsUp: undefined,
    comment: "",
    scoreOptions: {},
  };

  const { register, handleSubmit, watch, setValue, reset } =
    useForm<Annotation>({
      defaultValues: {
        isThumbsUp: undefined,
        comment: comment,
        scoreOptions: getAnnotation.data?.scoreOptions as
          | Record<string, { value: string; reason: string }>
          | undefined,
      },
    });

  const thumbsUpValue = watch("isThumbsUp");

  useEffect(() => {
    if (action === "edit") {
      const thumbValue =
        isThumbsUp === true
          ? "thumbsUp"
          : isThumbsUp === false
          ? "thumbsDown"
          : undefined;
      setValue("isThumbsUp", thumbValue);
      setValue("comment", comment);

      Object.entries(scoreOptions ?? {}).forEach(([key, value]) => {
        setValue(`scoreOptions.${key}`, {
          value: value.value,
          reason: value.reason,
        });
      });
    }
  }, [scoreOptions, setValue, action, isThumbsUp, comment]);

  const onSubmit = (data: Annotation) => {
    const isThumbsUp =
      data.isThumbsUp === "thumbsUp"
        ? true
        : data.isThumbsUp === "thumbsDown"
        ? false
        : undefined;

    if (action === "edit") {
      updateAnnotation.mutate(
        {
          id: id ?? "",
          projectId: project?.id ?? "",
          isThumbsUp: isThumbsUp,
          comment: data.comment,
          traceId: traceId,
          scoreOptions: (data.scoreOptions ?? {}) as Record<
            string,
            { value: string; reason: string }
          >,
        },
        {
          onSuccess: () => {
            toast({
              title: "Annotation Updated",
              description: `You have successfully updated the annotation`,
              status: "success",
              duration: 5000,
              isClosable: true,
              position: "top-right",
            });

            closeDrawer();
            reset();
            if (listTableView === "list" || listTableView === "table") {
              openDrawer("traceDetails", {
                traceId: traceId,
                selectedTab: "annotations",
              });
            }
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Error updating annotation",
              status: "error",
              duration: 5000,
              isClosable: true,
              position: "top-right",
            });
          },
        }
      );
    } else {
      createAnnotation.mutate(
        {
          projectId: project?.id ?? "",
          isThumbsUp: isThumbsUp,
          comment: data.comment,
          traceId: traceId,
          scoreOptions: (data.scoreOptions ?? {}) as Record<
            string,
            { value: string; reason: string }
          >,
        },
        {
          onSuccess: () => {
            toast({
              title: "Annotation Created",
              description: `You have successfully created an annotation`,
              status: "success",
              duration: 5000,
              isClosable: true,
              position: "top-right",
            });

            closeDrawer();
            reset();
            if (listTableView === "list" || listTableView === "table") {
              openDrawer("traceDetails", {
                traceId: traceId,
                selectedTab: "annotations",
              });
            }
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Error creating annotation",
              status: "error",
              duration: 5000,
              isClosable: true,
              position: "top-right",
            });
          },
        }
      );
    }
  };

  const handleDelete = () => {
    deleteAnnotation.mutate(
      {
        annotationId: id ?? "",
        projectId: project?.id ?? "",
      },
      {
        onSuccess: () => {
          toast({
            title: "Annotation Deleted",
            description: `You have successfully deleted the annotation`,
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top-right",
          });
          reset();
          closeDrawer();
        },
      }
    );
  };

  return (
    <Drawer
      isOpen={true}
      placement="right"
      size={"lg"}
      onClose={closeDrawer}
      onOverlayClick={onClose}
    >
      <DrawerContent>
        <DrawerHeader>
          <HStack>
            <DrawerCloseButton />
          </HStack>
          <HStack>
            <Text paddingTop={5} fontSize="2xl">
              Annotate
            </Text>
          </HStack>
          <Text fontSize="sm" fontWeight="normal" marginTop={2}>
            <HStack align="center">
              <MetadataTag label="Trace ID" value={traceId} />{" "}
              <ExternalLink
                width={16}
                cursor="pointer"
                onClick={() =>
                  openDrawer("traceDetails", {
                    traceId,
                    selectedTab: "annotations",
                  })
                }
              />
            </HStack>
          </Text>
        </DrawerHeader>

        <DrawerBody>
          {getAnnotation.isLoading ? (
            <Spinner />
          ) : (
            /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack align="start" spacing={3}>
                <RadioGroup value={thumbsUpValue ?? undefined}>
                  <HStack spacing={4}>
                    <VStack align="start">
                      <Radio
                        size="md"
                        value="thumbsUp"
                        colorScheme="blue"
                        alignItems="start"
                        spacing={3}
                        paddingTop={2}
                        {...register("isThumbsUp")}
                      >
                        <VStack align="start" marginTop={-1}>
                          <ThumbsUp />
                        </VStack>
                      </Radio>
                    </VStack>
                    <VStack align="start">
                      <Radio
                        size="md"
                        value="thumbsDown"
                        colorScheme="blue"
                        alignItems="start"
                        spacing={3}
                        paddingTop={2}
                        {...register("isThumbsUp")}
                      >
                        <VStack align="start" marginTop={-1}>
                          <ThumbsDown />
                        </VStack>
                      </Radio>
                    </VStack>
                  </HStack>
                </RadioGroup>
                {getAnnotationScoring.data?.map((scoreType) => {
                  const options = Array.isArray(scoreType.options)
                    ? (scoreType.options as AnnotationScoreOption[])
                    : [];
                  return ScoreBlock(
                    { ...scoreType, options },
                    watch,
                    register,
                    setValue
                  );
                })}
                <VStack align="start" spacing={4} width="full">
                  <Text>Comments</Text>
                  <Textarea {...register("comment")} />
                </VStack>
                <HStack>
                  <Button
                    colorScheme="blue"
                    type="submit"
                    minWidth="fit-content"
                    isLoading={
                      createAnnotation.isLoading || updateAnnotation.isLoading
                    }
                  >
                    {action === "new" ? "Save" : "Update"}
                  </Button>
                  {action === "edit" && (
                    <Button
                      colorScheme="red"
                      variant="outline"
                      isLoading={deleteAnnotation.isLoading}
                      onClick={() => handleDelete()}
                    >
                      Delete
                    </Button>
                  )}
                </HStack>

                {getAnnotationScoring.data?.length === 0 && (
                  <>
                    <Divider />
                    <Text>
                      Scoring metrics are currently disabled. Enable them to add
                      more data to your annotations.
                    </Text>
                    <Link href={"/settings/annotation-scores"}>
                      <Button
                        colorScheme="blue"
                        minWidth="fit-content"
                        size="sm"
                      >
                        Enable scoring metrics
                      </Button>
                    </Link>
                  </>
                )}
              </VStack>
            </form>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

type AnnotationScoreOption = {
  label: string;
  value: number;
};

type AnnotationScore = {
  id: string;
  name: string;
  options: AnnotationScoreOption[];
  description: string | null;
};

const ScoreBlock = (
  scoreType: AnnotationScore,
  watch: UseFormWatch<Annotation>,
  register: UseFormRegister<Annotation>,
  setValue: UseFormSetValue<Annotation>
) => {
  const scoreValue = watch(`scoreOptions.${scoreType.id}.value`);

  return (
    <HorizontalFormControl
      label={scoreType.name}
      helper={scoreType.description ?? ""}
    >
      <RadioGroup key={scoreType.id} value={scoreValue} padding={0}>
        <VStack align="start" spacing={2}>
          {scoreType.options.map((option) => {
            return (
              <Radio
                value={option.value.toString()}
                {...register(`scoreOptions.${scoreType.id}.value`)}
                key={option.value}
              >
                {option.label}
              </Radio>
            );
          })}
          <Spacer />
          <SmallLabel>Reasoning</SmallLabel>
          <HStack>
            <Input {...register(`scoreOptions.${scoreType.id}.reason`)} />
            <Button
              onClick={() => {
                setValue(`scoreOptions.${scoreType.id}.reason`, "");
                setValue(`scoreOptions.${scoreType.id}.value`, "");
              }}
            >
              <Trash />
            </Button>
          </HStack>
        </VStack>
      </RadioGroup>
    </HorizontalFormControl>
  );
};
