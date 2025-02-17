"use client";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import {
  ArrowLeftIcon,
  ArrowUpRight,
  ChevronDownIcon,
  FileBarChart,
  LogInIcon,
  LogOutIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RotateCcw,
  ShieldCloseIcon,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";

import { Container } from "@/components/container";
import { InviteDialog } from "@/components/invite-dialog";
import { StandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import { LoginLink } from "@/components/login-link";
import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";
import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { PollStatusLabel } from "@/components/poll-status";
import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/utils/trpc/client";

import { NextPageWithLayout } from "../../types";

const StatusControl = () => {
  const poll = usePoll();
  const queryClient = trpc.useUtils();
  const reopen = trpc.polls.reopen.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          event: null,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });
  const pause = trpc.polls.pause.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          closed: true,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const resume = trpc.polls.resume.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          closed: false,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button>
            <PollStatusLabel status={poll.status} />
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {poll.event ? (
            <DropdownMenuItem
              onClick={() => {
                reopen.mutate({ pollId: poll.id });
              }}
            >
              <DropdownMenuItemIconLabel icon={RotateCcw}>
                <Trans i18nKey="reopenPoll" defaults="Reopen Poll" />
              </DropdownMenuItemIconLabel>
            </DropdownMenuItem>
          ) : (
            <>
              {poll.closed ? (
                <DropdownMenuItem
                  onClick={() => resume.mutate({ pollId: poll.id })}
                >
                  <DropdownMenuItemIconLabel icon={PlayCircleIcon}>
                    <Trans i18nKey="resumePoll" defaults="Resume" />
                  </DropdownMenuItemIconLabel>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => pause.mutate({ pollId: poll.id })}
                >
                  <DropdownMenuItemIconLabel icon={PauseCircleIcon}>
                    <Trans i18nKey="pausePoll" defaults="Pause" />
                  </DropdownMenuItemIconLabel>
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const AdminControls = () => {
  const poll = usePoll();
  const pollLink = `/poll/${poll.id}`;
  const pathname = usePathname();
  return (
    <TopBar>
      <div className="flex flex-col items-start justify-between gap-x-4 gap-y-2 sm:flex-row">
        <div className="flex min-w-0 gap-4">
          {pathname !== pollLink ? (
            <Button asChild>
              <Link href={pollLink}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <TopBarTitle title={poll?.title} icon={FileBarChart} />
        </div>
        <div className="flex items-center gap-x-2">
          <NotificationsToggle />
          <StatusControl />
          <ManagePoll />
          <InviteDialog />
        </div>
      </div>
    </TopBar>
  );
};

const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex min-w-0 grow flex-col">
      <AdminControls />
      <div>
        <Container className="py-3 sm:py-8">{children}</Container>
      </div>
    </div>
  );
};

export const PermissionGuard = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const { user } = useUser();
  if (!poll.adminUrlId) {
    return (
      <PageDialog icon={ShieldCloseIcon}>
        <PageDialogHeader>
          <PageDialogTitle>
            <Trans i18nKey="permissionDenied" defaults="Unauthorized" />
          </PageDialogTitle>
          <PageDialogDescription>
            <Trans
              i18nKey="permissionDeniedDescription"
              defaults="If you are the poll creator, please login to administor your poll."
            />
          </PageDialogDescription>
          <PageDialogDescription>
            <Trans
              i18nKey="permissionDeniedParticipant"
              defaults="If you are not the poll creator, you should go to the Invite Page."
              components={{
                a: <Link className="text-link" href={`/invite/${poll.id}`} />,
              }}
            />
          </PageDialogDescription>
        </PageDialogHeader>
        <PageDialogFooter>
          {user.isGuest ? (
            <Button asChild variant="primary" size="lg">
              <LoginLink>
                <LogInIcon className="-ml-1 h-5 w-5" />
                <Trans i18nKey="login" defaults="Login" />
              </LoginLink>
            </Button>
          ) : (
            <Button asChild variant="primary" size="lg">
              <Link href="/logout">
                <LogOutIcon className="-ml-1 h-5 w-5" />
                <Trans i18nKey="loginDifferent" defaults="Switch user" />
              </Link>
            </Button>
          )}
          <Button asChild size="lg">
            <Link href={`/invite/${poll.id}`}>
              <Trans i18nKey="goToInvite" defaults="Go to Invite Page" />
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </PageDialogFooter>
      </PageDialog>
    );
  }

  return <>{children}</>;
};

const Title = () => {
  const poll = usePoll();
  return (
    <Head>
      <title>{poll.title}</title>
    </Head>
  );
};

const Prefetch = ({ children }: React.PropsWithChildren) => {
  const params = useParams();

  const urlId = params?.urlId as string;

  const poll = trpc.polls.get.useQuery({ urlId });
  const participants = trpc.polls.participants.list.useQuery({ pollId: urlId });
  const watchers = trpc.polls.getWatchers.useQuery({ pollId: urlId });

  if (!poll.data || !watchers.data || !participants.data) {
    return (
      <div>
        <TopBar className="flex flex-col items-start justify-between gap-x-4 gap-y-2 sm:flex-row">
          <Skeleton className="my-2 h-5 w-48" />
          <div className="flex gap-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </TopBar>
      </div>
    );
  }

  return <>{children}</>;
};

export const PollLayout = ({ children }: React.PropsWithChildren) => {
  const params = useParams();

  const urlId = params?.urlId as string;

  if (!urlId) {
    // probably navigating away
    return null;
  }

  return (
    <Prefetch>
      <LegacyPollContextProvider>
        <Title />
        <PermissionGuard>
          <Layout>{children}</Layout>
        </PermissionGuard>
      </LegacyPollContextProvider>
    </Prefetch>
  );
};

export const getPollLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <PollLayout>{page}</PollLayout>
      </StandardLayout>
    );
  };
