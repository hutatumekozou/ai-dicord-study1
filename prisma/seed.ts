import "dotenv/config";

import { addDays, startOfDay, subDays } from "date-fns";
import { File } from "node:buffer";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  ProductStudyImageKind,
  ReviewActionType,
} from "../src/generated/prisma/client";
import { saveUploadedImages } from "../src/lib/storage/local";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || "",
  }),
});

async function ensureSeedImages() {
  const svgTemplates = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
      <rect width="100%" height="100%" fill="#eff6ff" />
      <text x="50%" y="45%" text-anchor="middle" font-size="40" fill="#0f172a">AI知識サンプル 1</text>
      <text x="50%" y="58%" text-anchor="middle" font-size="22" fill="#475569">LLM / 仕組み / 復習</text>
    </svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
      <rect width="100%" height="100%" fill="#fffbeb" />
      <text x="50%" y="45%" text-anchor="middle" font-size="40" fill="#0f172a">AI知識サンプル 2</text>
      <text x="50%" y="58%" text-anchor="middle" font-size="22" fill="#92400e">RAG / 検索 / 根拠</text>
    </svg>`,
  ];

  const files = svgTemplates.map(
    (svgTemplate, index) =>
      new File([svgTemplate], `seed-${index + 1}.svg`, {
        type: "image/svg+xml",
      }),
  );

  return {
    walletImages: await saveUploadedImages([files[0]], ProductStudyImageKind.QUESTION),
    ironImages: await saveUploadedImages([files[1]], ProductStudyImageKind.QUESTION),
    vintageImages: await saveUploadedImages(files, ProductStudyImageKind.QUESTION),
  };
}

async function main() {
  const { walletImages, ironImages, vintageImages } = await ensureSeedImages();
  const today = startOfDay(new Date());

  await prisma.activeConversationState.deleteMany();
  await prisma.reviewLog.deleteMany();
  await prisma.productStudyImage.deleteMany();
  await prisma.productStudyItem.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      discordUserId: process.env.DISCORD_DEFAULT_USER_ID || null,
      lineUserId: process.env.LINE_DEFAULT_USER_ID || null,
      displayName: "ローカル利用者",
    },
  });

  const item1 = await prisma.productStudyItem.create({
    data: {
      userId: user.id,
      questionNumber: 1,
      productName: "LLMの基本",
      brandName: "LLM",
      category: "AI基礎",
      note: "大規模言語モデルが文章を生成する基本を復習する。",
      memo: "確率的に次のトークンを予測する点を押さえる。",
      firstScheduledAt: today,
      nextScheduledAt: today,
      status: "PENDING",
      summary: "LLMは大量のテキストから学習し、文脈に続く可能性の高いトークンを生成する。",
      question:
        "LLMが自然な文章を生成できる基本的な仕組みを説明してください。",
      answer:
        "大量の文章データから単語や文脈の関係を学習し、入力された文脈に対して次に来る可能性が高いトークンを順番に予測することで文章を作ります。",
      explanation:
        "LLMは意味を辞書のように検索しているだけではなく、文脈のパターンをもとに出力します。そのため自然な回答ができますが、事実確認が必要な場面では誤りも起こります。",
      difficulty: "medium",
      tags: ["LLM", "トークン", "生成AI"],
      keyPoints: ["文脈理解", "トークン予測", "事実確認"],
      images: {
        create: walletImages.map((image) => ({
          kind: image.kind,
          imagePath: image.imagePath,
          sortOrder: image.sortOrder,
        })),
      },
    },
  });

  const item2 = await prisma.productStudyItem.create({
    data: {
      userId: user.id,
      questionNumber: 2,
      productName: "RAGの基本",
      brandName: "RAG",
      category: "RAG",
      note: "社内資料や外部データを参照して回答する仕組み。",
      memo: "検索と生成を分けて理解する。",
      firstScheduledAt: subDays(today, 2),
      nextScheduledAt: addDays(today, 6),
      status: "CORRECT",
      summary: "RAGは検索で関連情報を取り出し、その情報を根拠にLLMが回答を生成する仕組み。",
      question:
        "RAGを使うメリットを、通常のLLM回答との違いが分かるように説明してください。",
      answer:
        "RAGは外部資料から関連情報を検索してから回答するため、最新情報や社内固有情報を反映しやすく、回答の根拠も示しやすくなります。",
      explanation:
        "通常のLLMは学習済み知識に頼るため、古い情報や知らない社内情報には弱いです。RAGは必要な情報を検索して補うことで、回答精度と説明責任を上げます。",
      difficulty: "easy",
      tags: ["RAG", "検索", "根拠"],
      keyPoints: ["外部情報参照", "根拠提示", "最新情報"],
      images: {
        create: ironImages.map((image) => ({
          kind: image.kind,
          imagePath: image.imagePath,
          sortOrder: image.sortOrder,
        })),
      },
      reviewLogs: {
        create: [
          {
            userId: user.id,
            actionType: ReviewActionType.SENT,
            actionAt: subDays(today, 1),
          },
          {
            userId: user.id,
            actionType: ReviewActionType.ANSWER_SHOWN,
            actionAt: subDays(today, 1),
            rawText: "解答",
          },
          {
            userId: user.id,
            actionType: ReviewActionType.CORRECT,
            actionAt: subDays(today, 1),
            rawText: "正解",
          },
        ],
      },
    },
  });

  const item3 = await prisma.productStudyItem.create({
    data: {
      userId: user.id,
      questionNumber: 3,
      productName: "プロンプト設計",
      brandName: "PROMPT",
      category: "プロンプト",
      note: "AIに期待する役割、条件、出力形式を明確にする。",
      memo: "曖昧な依頼を避ける。",
      firstScheduledAt: subDays(today, 1),
      nextScheduledAt: today,
      status: "ANSWER_SHOWN",
      summary: "良いプロンプトは目的、前提、制約、出力形式を具体化してAIの回答品質を安定させる。",
      question:
        "AIへの指示で、回答品質を安定させるために入れるべき要素を説明してください。",
      answer:
        "目的、AIの役割、前提条件、守るべき制約、出力形式、判断基準、例を入れると回答が安定します。",
      explanation:
        "曖昧な依頼ではAIが補完しすぎて意図とずれることがあります。条件と完成形を先に伝えると、確認しやすく再利用しやすい回答になります。",
      difficulty: "hard",
      tags: ["プロンプト", "指示設計", "出力形式"],
      keyPoints: ["目的明示", "制約条件", "出力形式"],
      images: {
        create: vintageImages.map((image) => ({
          kind: image.kind,
          imagePath: image.imagePath,
          sortOrder: image.sortOrder,
        })),
      },
      reviewLogs: {
        create: [
          {
            userId: user.id,
            actionType: ReviewActionType.SENT,
            actionAt: subDays(today, 1),
          },
          {
            userId: user.id,
            actionType: ReviewActionType.ANSWER_SHOWN,
            actionAt: subDays(today, 1),
            rawText: "解答",
          },
        ],
      },
    },
  });

  await prisma.activeConversationState.create({
    data: {
      userId: user.id,
      itemId: item3.id,
      state: "ANSWER_SHOWN",
    },
  });

  console.info("Seed completed", {
    userId: user.id,
    itemIds: [item1.id, item2.id, item3.id],
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
