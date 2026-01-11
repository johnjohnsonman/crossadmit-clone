import { NextResponse } from "next/server";
import { AdmissionRecord, Comment } from "@/lib/types";
import fs from "fs";
import path from "path";

function loadAdmissionData(): AdmissionRecord[] {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const latestPath = path.join(dataDir, "all-admissions.json");
    
    if (fs.existsSync(latestPath)) {
      const data = fs.readFileSync(latestPath, "utf-8");
      const records: AdmissionRecord[] = JSON.parse(data);
      return records.map((record) => ({
        ...record,
        createdAt: new Date(record.createdAt),
        comments: record.comments?.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })) || [],
      }));
    }
  } catch (error) {
    console.error("Error loading admission data:", error);
  }
  return [];
}

function saveAdmissionData(records: AdmissionRecord[]): void {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const latestPath = path.join(dataDir, "all-admissions.json");
    fs.writeFileSync(latestPath, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error("Error saving admission data:", error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const records = loadAdmissionData();
  const record = records.find((r) => r.id === id);

  if (!record) {
    return NextResponse.json(
      { error: "Record not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(record);
}

// 좋아요 추가
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, comment } = body;
    
    const records = loadAdmissionData();
    const recordIndex = records.findIndex((r) => r.id === id);

    if (recordIndex === -1) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    if (action === "like") {
      // 좋아요 추가
      records[recordIndex].likes = (records[recordIndex].likes || 0) + 1;
      saveAdmissionData(records);
      return NextResponse.json({ 
        success: true, 
        likes: records[recordIndex].likes 
      });
    } else if (action === "comment" && comment) {
      // 댓글 추가
      const newComment: Comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        author: comment.author || "익명",
        content: comment.content,
        createdAt: new Date(),
        isAnonymous: comment.isAnonymous || false,
      };

      if (!records[recordIndex].comments) {
        records[recordIndex].comments = [];
      }
      records[recordIndex].comments!.push(newComment);
      saveAdmissionData(records);
      
      return NextResponse.json({ 
        success: true, 
        comment: newComment,
        comments: records[recordIndex].comments 
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating admission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


