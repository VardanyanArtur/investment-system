/* eslint-disable @typescript-eslint/no-explicit-any */
import { refApi } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function TeamMembers() {
  const { t } = useTranslation();
  type Member = {
    _id: string;
    deposit: number;
    games: number;
    vip: string;
    level: 1 | 2;
  };
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refLink, setRefLink] = useState("");

  // const generateMembers = (count = 15) => {
  //   const randomId = () =>
  //     `1${Math.floor(100000 + Math.random() * 899999)
  //       .toString()
  //       .replace(/(\d{2})\d{2}(\d{2})/, "$1****$2")}`;
  //   const randomDeposit = () => `${Math.floor(100 + Math.random() * 5000)}$`;
  //   const randomGames = () => Math.floor(Math.random() * 50 + 1);
  //   const randomVIP = () => vipLevels[Math.floor(Math.random() * vipLevels.length)];

  //   return Array.from({ length: count }, () => ({
  //     id: randomId(),
  //     deposit: randomDeposit(),
  //     games: randomGames(),
  //     vip: randomVIP(),
  //   }));
  // };

  // const [teamMembers, setTeamMembers] = useState(generateMembers());

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // update random one member to simulate activity
  //     setTeamMembers((prev) => {
  //       const updated = [...prev];
  //       const index = Math.floor(Math.random() * updated.length);
  //       updated[index].deposit = `${Math.floor(100 + Math.random() * 5000)}$`;
  //       updated[index].games += 1;
  //       return updated;
  //     });
  //   }, 4000);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { tree } = await refApi.getRefMembers2()
        console.log(tree);

        const combined = [
          ...tree.level1.map((m: any) => ({ ...m, level: 1 })),
          ...tree.level2.map((m: any) => ({ ...m, level: 2 })),
        ];
        const link = await refApi.getRefLink()
        setRefLink(`${window.location.origin}?ref=${link.data.code}`);
        setLoading(false)
        setTeamMembers(combined);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);
  console.log(teamMembers);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }


  const shortId = (id: string) => {
    const first = id.slice(0, 4)
    const last = id.slice(-3)
    return first + "****" + last
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/50 to-background pt-8 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          {t('team.title')}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t('team.subtitle')}
        </p>
      </motion.div>
      {/* Invite Links Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 max-w-4xl mb-12"
      >
        <div className="bg-card border border-muted/30 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-1">{t('team.inviteTitle')}</h2>
            <p className="text-muted-foreground">
              {t('team.inviteSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Здесь можно вывести ref ссылку из API */}
            <input
              type="text"
              value={refLink || ""}
              readOnly
              className="bg-muted px-3 py-2 rounded-lg text-sm w-56 md:w-64"
            />
            <button
              onClick={() => navigator.clipboard.writeText(refLink)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              {t('team.copy')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-6"
      >
        <div className="border border-muted/30 bg-card rounded-2xl shadow-lg overflow-hidden max-w-6xl mx-auto">

          {/* Table Header */}
          <div className="grid grid-cols-5 text-center bg-primary/10 border-b border-muted/30 py-3 font-semibold text-primary text-lg">
            <span>{t('team.memberId')}</span>
            <span>{t('team.deposit')}</span>
            <span>{t('team.games')}</span>
            <span>{t('team.vipLevel')}</span>
            <span>{t('team.level')}</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-muted/20">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="grid grid-cols-5 text-center py-3 text-base font-medium"
              >
                <span className="font-mono text-muted-foreground">{shortId(member._id)}</span>
                <span className="text-green-500">{member.deposit}$</span>
                <span className="text-secondary font-semibold">{member.games}</span>
                <span className="text-primary">{member.vip}</span>
                <span className={member.level === 1 ? "text-blue-500" : "text-purple-500"}>
                  {member.level} {t('team.levelSuffix') /* например “уровень” */}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
