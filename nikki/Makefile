include $(TOPDIR)/rules.mk

PKG_NAME:=nikki
PKG_VERSION:=2026.02.08
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MetaCubeX/mihomo.git
PKG_SOURCE_VERSION:=v1.19.20
PKG_MIRROR_HASH:=ab83118867b4325139864f5b57c4acef750631c5decfd8d3ba388d5d2afa5e23

PKG_LICENSE:=GPL3.0+
PKG_MAINTAINER:=Joseph Mory <morytyann@gmail.com>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

PKG_BUILD_TIME:=$(shell date -u -Iseconds)

GO_PKG:=github.com/metacubex/mihomo
GO_PKG_LDFLAGS_X:=$(GO_PKG)/constant.Version=$(PKG_SOURCE_VERSION) $(GO_PKG)/constant.BuildTime=$(PKG_BUILD_TIME)
GO_PKG_TAGS:=with_gvisor

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/nikki
  SECTION:=net
  CATEGORY:=Network
  TITLE:=A rule based proxy in Go.
  URL:=https://wiki.metacubex.one
  DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle +curl +yq firewall4 +ip-full +kmod-inet-diag +kmod-nft-socket +kmod-nft-tproxy +kmod-tun +kmod-dummy
  PROVIDES:=mihomo
  ALTERNATIVES:=\
    300:/usr/bin/mihomo:/usr/libexec/nikki
endef

define Package/nikki/description
  A rule based proxy in Go.
endef

define Package/nikki/conffiles
/etc/config/nikki
/etc/nikki/mixin.yaml
endef

define Package/nikki/install
	$(INSTALL_DIR) $(1)/etc/nikki
	$(INSTALL_DIR) $(1)/etc/nikki/profiles
	$(INSTALL_DIR) $(1)/etc/nikki/run
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/usr/share/nikki
	$(INSTALL_DIR) $(1)/usr/share/rpcd/ucode
	$(INSTALL_DIR) $(1)/usr/libexec/nikki
	$(INSTALL_DIR) $(1)$(NIKKI_STATE_DIR)
	$(INSTALL_DIR) $(1)/usr/share/nftables.d/ruleset-post
	$(INSTALL_DIR) $(1)/lib/upgrade/keep.d

	$(INSTALL_CONF) ./files/mixin.yaml $(1)/etc/nikki/mixin.yaml
	$(INSTALL_CONF) ./files/profiles/mahavpn.yaml $(1)/etc/nikki/profiles/mahavpn.yaml
	$(INSTALL_CONF) ./files/nikki.conf $(1)/etc/config/nikki
	$(INSTALL_BIN) ./files/nikki.init $(1)/etc/init.d/nikki
	$(INSTALL_BIN) ./files/nikki.upgrade $(1)/lib/upgrade/keep.d/nikki
	$(INSTALL_BIN) ./files/uci-defaults/firewall.sh $(1)/etc/uci-defaults/99_firewall_nikki
	$(INSTALL_BIN) ./files/uci-defaults/init.sh $(1)/etc/uci-defaults/99_nikki
	$(INSTALL_BIN) ./files/uci-defaults/migrate.sh $(1)/etc/uci-defaults/99_nikki_migrate
	$(INSTALL_DATA) ./files/ucode/include.uc $(1)/usr/share/rpcd/ucode/nikki
	$(INSTALL_DATA) ./files/ucode/hijack.ut $(1)/usr/share/rpcd/ucode/luci/nikki/hijack.ut
	$(INSTALL_DATA) ./files/ucode/mixin.uc $(1)/usr/share/rpcd/ucode/luci/nikki/mixin.uc
	$(INSTALL_DATA) ./files/nftables/geoip_cn.nft $(1)/usr/share/nftables.d/ruleset-post/90-geoip_cn.nft
	$(INSTALL_DATA) ./files/nftables/geoip6_cn.nft $(1)/usr/share/nftables.d/ruleset-post/91-geoip6_cn.nft
	$(INSTALL_BIN) ./files/scripts/include.sh $(1)/usr/share/nikki/include.sh
	$(INSTALL_BIN) ./files/scripts/firewall_include.sh $(1)/usr/share/nikki/firewall_include.sh
	$(INSTALL_BIN) ./files/scripts/debug.sh $(1)/usr/libexec/nikki/debug.sh

	$(CP) ./files/run/. $(1)/etc/nikki/run/
endef

define Package/nikki/conffiles
/etc/config/nikki
/etc/nikki/mixin.yaml
/etc/nikki/profiles/mahavpn.yaml
endef

define Package/nikki/postrm
#!/bin/sh
if [ -z $${IPKG_INSTROOT} ]; then
	uci -q batch <<-EOF > /dev/null
		del firewall.nikki
		commit firewall
	EOF
fi
endef

define Build/Prepare
	$(Build/Prepare/Default)
	$(RM) -r $(PKG_BUILD_DIR)/rules/logic_test
endef

$(eval $(call GoBinPackage,nikki))
$(eval $(call BuildPackage,nikki))
