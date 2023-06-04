import { type NextPage } from "next";
import Head from "next/head";
import { SignInButton, useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime'
import Image from "next/image";

dayjs.extend(relativeTime)

const CreatPostWizard = () => {
    const { user } = useUser()

    if (!user) return null

    console.log(user)

    if (!user.profileImageUrl) return null

    return (
        <div className="flex w-full gap-3">
            {/* <Image src={() => user.profileImageUrl ? user.profileImageUrl : ""} alt="Profile Image" className="h-14 w-14 rounded-full" width={56} height={56}  */}
            <Image src={user.profileImageUrl} alt="Profile Image" className="h-14 w-14 rounded-full" width={56} height={56} 
                placeholder="blur" blurDataURL={user.profileImageUrl} />
            <input placeholder="Type some emojis!" className="grow bg-transparent outline-none" />
        </div>
    )
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number]

const PostView = (props: PostWithUser) => {
    const {post, author} = props

    if (!author.username) return null
    if (!author.profilePicture) return null

    return (
        <div key={post.id} className="border-b border-slate-400 p-4 flex gap-3">
            <Image src={author.profilePicture} alt={`@${author.username}'s profile picture`} className="h-14 w-14 rounded-full" 
                width={56} height={56} />
            <div className="flex flex-col">
                <div className="flex text-slate-300 gap-1">
                    <span>{`@${author.username}`}</span>
                    <span className="font-thin">{` . ${dayjs(post.createdAt).fromNow()}`}</span>
                </div>
                <span>{post.content}</span>
            </div>
        </div>
    )
}

const Home: NextPage = () => {
    const user = useUser()
    const { data, isLoading } = api.posts.getAll.useQuery()

    if (isLoading) return <div>Loading...</div>

    if (!data) return <div>Something went wrong</div>

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
            <div className="flex border-b border-slate-200 p-4">
                {!user.isSignedIn && (
                    <div className="flex justify-center">
                        <SignInButton />
                    </div>
                )}
                {user.isSignedIn && <CreatPostWizard />}
            </div>
            <div className="flex flex-col">
                {[...data, ...data]?.map((fullPost) => (
                    <PostView {...fullPost} key={fullPost.post.id}/>
                ))}
            </div>
        </div>
      </main>
    </>
  );
};

export default Home;
